// Import the functions you need from the SDKs you need
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORDERS_FILE = path.join(__dirname, "orders.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// Initialize uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Stripe Implementation
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn("STRIPE_SECRET_KEY is missing. Payment features will fail.");
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // API: Create Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { packageName, priceLabel, vin, email, firstName, lastName, country, policyAgreed, phone } = req.body;
    const client = getStripe();

    if (!client) {
      return res.status(500).json({ error: "Stripe is not configured on the server." });
    }

    try {
      // Map display price to cents for Stripe
      const priceMap: Record<string, number> = {
        "Basic": 3999,
        "Premium": 4999,
        "Gold": 5999
      };
      
      const amount = priceMap[packageName] || 3999;

      const session = await client.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${packageName} Vehicle History Report`,
                description: `VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/?success=true`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/?canceled=true`,
        customer_email: email,
      });

      // Save order data locally and to Firebase
      const newOrder = {
        id: session.id,
        packageName,
        vin,
        email,
        firstName,
        lastName,
        phone: phone || "",
        country: country || "United States",
        amount: amount / 100,
        createdAt: new Date().toISOString(),
        status: "pending",
        policyAgreed: !!policyAgreed
      };

      // Still save to local JSON for backup, but primary is Firestore
      const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
      orders.push(newOrder);
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

      try {
        await addDoc(collection(db, "orders"), newOrder);
      } catch (fbError) {
        console.error("Error saving to Firebase:", fbError);
      }

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Create Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    const { packageName, vin, email, firstName, lastName, country, policyAgreed, phone } = req.body;
    const client = getStripe();

    if (!client) {
      return res.status(500).json({ error: "Stripe is not configured on the server." });
    }

    try {
      const priceMap: Record<string, number> = {
        "Basic": 3999,
        "Premium": 4999,
        "Gold": 5999
      };
      
      const amount = priceMap[packageName] || 3999;

      const paymentIntent = await client.paymentIntents.create({
        amount,
        currency: "usd",
        receipt_email: email,
        description: `${packageName} Vehicle History Report for VIN: ${vin || "Pending"}`,
        metadata: {
          packageName,
          vin: vin || "Pending",
          firstName,
          lastName,
          country: country || "United States"
        }
      });

      // Save order data locally and to Firebase
      const newOrder = {
        id: paymentIntent.id,
        packageName,
        vin,
        email,
        firstName,
        lastName,
        phone: phone || "",
        country: country || "United States",
        amount: amount / 100,
        createdAt: new Date().toISOString(),
        status: "pending",
        policyAgreed: !!policyAgreed
      };

      const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
      orders.push(newOrder);
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

      try {
        await addDoc(collection(db, "orders"), newOrder);
      } catch (fbError) {
        console.error("Error saving to Firebase:", fbError);
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get All Orders (Admin Only)
  app.get("/api/orders", async (req, res) => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const orders = querySnapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch orders from Firebase:", error);
      // Fallback to local JSON
      try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
        res.json(orders);
      } catch (fsError) {
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  });

  // API: Update Order Status (Admin Only)
  app.put("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status, reportStatus } = req.body;

    // 1. Update in Firebase Firestore
    try {
      const q = query(collection(db, "orders"), where("id", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const fbDoc = querySnapshot.docs[0];
        const docRef = doc(db, "orders", fbDoc.id);
        const updates: any = {};
        if (status !== undefined) updates.status = status;
        if (reportStatus !== undefined) updates.reportStatus = reportStatus;
        
        await updateDoc(docRef, updates);
      }
    } catch (fbError) {
      console.error("Failed to update in Firebase:", fbError);
    }

    // 2. Update in local orders.json
    try {
      const fileData = fs.readFileSync(ORDERS_FILE, "utf-8");
      let orders = JSON.parse(fileData);
      let updated = false;
      orders = orders.map((order: any) => {
        if (order.id === id) {
          updated = true;
          return {
            ...order,
            ...(status !== undefined && { status }),
            ...(reportStatus !== undefined && { reportStatus })
          };
        }
        return order;
      });
      if (updated) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      }
      res.json({ success: true });
    } catch (fsError) {
      console.error("Failed to update in local JSON:", fsError);
      res.status(500).json({ error: "Failed to update order in file storage" });
    }
  });

  // API: Upload Report
  app.post("/api/orders/:id/report", async (req, res) => {
    const { id } = req.params;
    const { fileName, secureUrl } = req.body;

    if (!fileName || !secureUrl) {
      return res.status(400).json({ error: "fileName and secureUrl are required" });
    }

    try {
      // Update in Firebase Firestore
      let updatedInFirebase = false;
      try {
        const q = query(collection(db, "orders"), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const fbDoc = querySnapshot.docs[0];
          const docRef = doc(db, "orders", fbDoc.id);
          await updateDoc(docRef, {
            reportFileName: fileName,
            reportFilePath: secureUrl,
            reportStatus: "sent"
          });
          updatedInFirebase = true;
        }
      } catch (fbError) {
        console.error("Failed to update Firebase with report info:", fbError);
      }

      // Update in local orders.json
      let updatedInLocal = false;
      try {
        const fileDataJson = fs.readFileSync(ORDERS_FILE, "utf-8");
        let orders = JSON.parse(fileDataJson);
        orders = orders.map((order: any) => {
          if (order.id === id) {
            updatedInLocal = true;
            return {
              ...order,
              reportFileName: fileName,
              reportFilePath: secureUrl,
              reportStatus: "sent"
            };
          }
          return order;
        });
        if (updatedInLocal) {
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        }
      } catch (fsError) {
        console.error("Failed to update local JSON with report info:", fsError);
      }

      if (!updatedInFirebase && !updatedInLocal) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ success: true, reportFileName: fileName, reportFilePath: secureUrl });
    } catch (error: any) {
      console.error("Error updating report status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Delete Report
  app.delete("/api/orders/:id/report", async (req, res) => {
    const { id } = req.params;
    try {
      let reportFilePath = "";
      
      try {
        const fileDataJson = fs.readFileSync(ORDERS_FILE, "utf-8");
        const orders = JSON.parse(fileDataJson);
        const order = orders.find((o: any) => o.id === id);
        if (order && order.reportFilePath) {
          reportFilePath = order.reportFilePath;
        }
      } catch (fsError) {
        console.error("Failed to read report file path from local JSON:", fsError);
      }

      if (reportFilePath && !reportFilePath.startsWith("http://") && !reportFilePath.startsWith("https://")) {
        const fullPath = path.join(UPLOADS_DIR, reportFilePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Update Firebase
      try {
        const q = query(collection(db, "orders"), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const fbDoc = querySnapshot.docs[0];
          const docRef = doc(db, "orders", fbDoc.id);
          await updateDoc(docRef, {
            reportFileName: "",
            reportFilePath: "",
            reportStatus: "not sent",
            downloads: []
          });
        }
      } catch (fbError) {
        console.error("Failed to update Firebase for delete:", fbError);
      }

      // Update Local JSON
      let updated = false;
      try {
        const fileDataJson = fs.readFileSync(ORDERS_FILE, "utf-8");
        const orders = JSON.parse(fileDataJson);
        const updatedOrders = orders.map((o: any) => {
          if (o.id === id) {
            updated = true;
            return {
              ...o,
              reportFileName: "",
              reportFilePath: "",
              reportStatus: "not sent",
              downloads: []
            };
          }
          return o;
        });
        if (updated) {
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(updatedOrders, null, 2));
        }
      } catch (fsError) {
        console.error("Failed to update local JSON for delete:", fsError);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Download Report (Captured and tracked)
  app.get("/download/:id", async (req, res) => {
    const { id } = req.params;

    try {
      let order: any = null;

      // 1. Fetch from Firestore
      try {
        const q = query(collection(db, "orders"), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          order = querySnapshot.docs[0].data();
        }
      } catch (fbError) {
        console.error("Failed to fetch order from Firebase for download:", fbError);
      }

      // 2. Fallback to local JSON
      if (!order) {
        try {
          const fileDataJson = fs.readFileSync(ORDERS_FILE, "utf-8");
          const orders = JSON.parse(fileDataJson);
          order = orders.find((o: any) => o.id === id);
        } catch (fsError) {
          console.error("Failed to fetch order from local JSON for download:", fsError);
        }
      }

      if (!order || !order.reportFilePath) {
        return res.status(404).send("Report not found or not yet uploaded.");
      }

      const isCloudinaryUrl = order.reportFilePath.startsWith("http://") || order.reportFilePath.startsWith("https://");

      if (!isCloudinaryUrl) {
        const filePath = path.join(UPLOADS_DIR, order.reportFilePath);
        if (!fs.existsSync(filePath)) {
          return res.status(404).send("Report file not found on server.");
        }
      }

      // Record download details
      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
      const downloadEvent = {
        timestamp: new Date().toISOString(),
        ip
      };

      const downloads = order.downloads ? [...order.downloads, downloadEvent] : [downloadEvent];

      // Update in Firebase Firestore
      try {
        const q = query(collection(db, "orders"), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const fbDoc = querySnapshot.docs[0];
          const docRef = doc(db, "orders", fbDoc.id);
          await updateDoc(docRef, { downloads });
        }
      } catch (fbError) {
        console.error("Failed to update Firebase downloads count:", fbError);
      }

      // Update in local orders.json
      try {
        const fileDataJson = fs.readFileSync(ORDERS_FILE, "utf-8");
        let orders = JSON.parse(fileDataJson);
        orders = orders.map((o: any) => {
          if (o.id === id) {
            return {
              ...o,
              downloads
            };
          }
          return o;
        });
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      } catch (fsError) {
        console.error("Failed to update local JSON downloads count:", fsError);
      }

      // Serve the file
      if (isCloudinaryUrl) {
        res.redirect(order.reportFilePath);
      } else {
        const filePath = path.join(UPLOADS_DIR, order.reportFilePath);
        res.download(filePath, order.reportFileName || "report.pdf");
      }
    } catch (error: any) {
      console.error("Error during download:", error);
      res.status(500).send("Internal server error during download.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

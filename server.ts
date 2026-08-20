// Import the functions you need from the SDKs you need
import express from "express";

import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { db } from "./firebaseConfig.js";

const __filename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof module !== "undefined" && module.filename ? module.filename : "");
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === "1";
const UPLOADS_DIR = isVercel ? "/tmp/uploads" : path.join(__dirname, "uploads");

// Initialize uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
dotenv.config();

const app = express();
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
        "Basic": 4999,
        "Gold": 8999,
        "Premium": 9999
      };
      
      const amount = priceMap[packageName] || 4999;

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

      // Save order data directly to Firebase Firestore
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

      await db.collection("orders").add(newOrder);

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
        "Basic": 4999,
        "Gold": 8999,
        "Premium": 9999
      };
      
      const amount = priceMap[packageName] || 4999;

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

      // Save order data directly to Firebase Firestore
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

      await db.collection("orders").add(newOrder);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get All Orders (Admin Only)
  app.get("/api/orders", async (req, res) => {
    try {
      const querySnapshot = await db.collection("orders").get();
      const orders = querySnapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      res.json(orders);
    } catch (error: any) {
      console.error("Failed to fetch orders from Firebase:", error);
      res.status(500).json({ error: "Failed to fetch orders from Firebase: " + error.message });
    }
  });

  // API: Update Order Status (Admin Only)
  app.put("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status, reportStatus } = req.body;

    // Update in Firebase Firestore
    try {
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const fbDoc = querySnapshot.docs[0];
      const docRef = db.collection("orders").doc(fbDoc.id);
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (reportStatus !== undefined) updates.reportStatus = reportStatus;
      
      await docRef.update(updates);
      res.json({ success: true });
    } catch (fbError: any) {
      console.error("Failed to update in Firebase:", fbError);
      res.status(500).json({ error: "Failed to update in Firebase: " + fbError.message });
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
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const fbDoc = querySnapshot.docs[0];
      const docRef = db.collection("orders").doc(fbDoc.id);
      await docRef.update({
        reportFileName: fileName,
        reportFilePath: secureUrl,
        reportStatus: "sent"
      });

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
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const fbDoc = querySnapshot.docs[0];
      const order = fbDoc.data();
      const reportFilePath = order.reportFilePath || "";

      if (reportFilePath && !reportFilePath.startsWith("http://") && !reportFilePath.startsWith("https://")) {
        const fullPath = path.join(UPLOADS_DIR, reportFilePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const docRef = db.collection("orders").doc(fbDoc.id);
      await docRef.update({
        reportFileName: "",
        reportFilePath: "",
        reportStatus: "not sent",
        downloads: []
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Delete Order Record (Admin Only)
  app.delete("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const fbDoc = querySnapshot.docs[0];
      const order = fbDoc.data();
      const reportFilePath = order.reportFilePath || "";

      // Cleanup local report file if it exists
      if (reportFilePath && !reportFilePath.startsWith("http://") && !reportFilePath.startsWith("https://")) {
        const fullPath = path.join(UPLOADS_DIR, reportFilePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      await db.collection("orders").doc(fbDoc.id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Download Report (Captured and tracked)
  app.get("/download/:id", async (req, res) => {
    const { id } = req.params;

    try {
      let order: any = null;
      let fbDocId = "";

      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (!querySnapshot.empty) {
        fbDocId = querySnapshot.docs[0].id;
        order = querySnapshot.docs[0].data();
      }

      if (!order || !order.reportFilePath) {
        return res.status(404).send("Report not found or not yet uploaded.");
      }

      const isCloudUrl = order.reportFilePath.startsWith("http://") || order.reportFilePath.startsWith("https://");

      if (!isCloudUrl && isVercel) {
        return res.status(410).send("This report was stored locally and is no longer available. Please re-upload the report from the Admin Dashboard.");
      }

      if (!isCloudUrl) {
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

      // Update download count in Firebase Firestore
      const docRef = db.collection("orders").doc(fbDocId);
      await docRef.update({ downloads });

      // Serve the file
      if (isCloudUrl) {
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

  // Dynamic sitemap endpoint
  app.get("/sitemap.xml", (req, res) => {
    res.header("Content-Type", "application/xml");
    const appUrl = process.env.APP_URL || "https://allvinreport.com";
    const today = new Date().toISOString().split("T")[0];
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${appUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  // Vite middleware for development
  if (!isVercel) {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    if (process.env.NODE_ENV !== "production") {
      // Dynamically import vite only in local dev - it is a devDependency not
      // available in production / Vercel environments.
      import("vite").then(({ createServer: createViteServer }) => {
        createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        }).then((vite) => {
          app.use(vite.middlewares);
          app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on http://localhost:${PORT}`);
          });
        });
      });
    } else {
      const distPath = path.join(__dirname, "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  }

export default app;

// Import the functions you need from the SDKs you need
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

const ORDERS_FILE = path.join(process.cwd(), "orders.json");

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

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
    const { packageName, priceLabel, vin, email, firstName, lastName, country } = req.body;
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
        country: country || "United States",
        amount: amount / 100,
        createdAt: new Date().toISOString(),
        status: "pending"
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
    const { packageName, vin, email, firstName, lastName, country } = req.body;
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
        country: country || "United States",
        amount: amount / 100,
        createdAt: new Date().toISOString(),
        status: "pending"
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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

// Import the functions you need from the SDKs you need
import express from "express";

import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { db } from "./firebaseConfig.js";
import { calculateOrderPricing } from "./src/promotions.js";

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
    const {
      packageName,
      includeWindowSticker,
      priceLabel,
      vin,
      email,
      firstName,
      lastName,
      country,
      policyAgreed,
      phone,
    } = req.body;
    const client = getStripe();

    if (!client) {
      return res
        .status(500)
        .json({ error: "Stripe is not configured on the server." });
    }

    try {
      const pricing = calculateOrderPricing(packageName, includeWindowSticker);
      const totalAmountCents = Math.round(pricing.finalAmountPaid * 100);

      let line_items: any[] = [];

      if (pricing.packageTier === "basic") {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Basic Vehicle History Report",
              description: `VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
            },
            unit_amount: Math.round(pricing.packageOriginalPrice * 100), // 4495 ($44.95)
          },
          quantity: 1,
        });

        if (pricing.windowStickerIncluded) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Window Sticker Add-on (25% Promotional Discount Applied)",
                description: `Official Vehicle Window Label Verification & OEM Window Sticker for VIN: ${vin || "Pending"}`,
              },
              unit_amount: Math.round(pricing.windowStickerFinalPrice * 100), // 2249 ($22.49)
            },
            quantity: 1,
          });
        }
      } else if (pricing.packageTier === "gold") {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Gold Vehicle History Report",
              description: `VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
            },
            unit_amount: Math.round(pricing.packageOriginalPrice * 100), // 8995 ($89.95)
          },
          quantity: 1,
        });

        if (pricing.windowStickerIncluded) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Window Sticker Add-on (50% Promotional Discount Applied)",
                description: `Official Vehicle Window Label Verification & OEM Window Sticker for VIN: ${vin || "Pending"}`,
              },
              unit_amount: Math.round(pricing.windowStickerFinalPrice * 100), // 1499 ($14.99)
            },
            quantity: 1,
          });
        }
      } else if (pricing.packageTier === "platinum") {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Platinum Vehicle History Report (Includes FREE Window Sticker)",
              description: `Official OEM Window Sticker Included FREE ($29.99 Value) | VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
            },
            unit_amount: Math.round(pricing.finalAmountPaid * 100), // 9995 ($99.95)
          },
          quantity: 1,
        });
      } else if (pricing.packageTier === "diamond") {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Diamond Vehicle History Report (Includes FREE Window Sticker & FREE Salvage Information)",
              description: `Window Sticker FREE ($29.99 Value) + Salvage Information FREE ($149.00 Value) | VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
            },
            unit_amount: Math.round(pricing.finalAmountPaid * 100), // 12995 ($129.95)
          },
          quantity: 1,
        });
      } else {
        const mainAmountCents = Math.round(
          (pricing.packageTier === "window_sticker" ? 0 : pricing.packageOriginalPrice) * 100
        );
        if (mainAmountCents > 0) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: pricing.packageName,
                description: `VIN: ${vin || "Pending"} | For: ${firstName} ${lastName}`,
              },
              unit_amount: mainAmountCents,
            },
            quantity: 1,
          });
        }
        if (pricing.windowStickerIncluded && Math.round(pricing.windowStickerFinalPrice * 100) > 0) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Official Vehicle Window Sticker",
                description: `Official Vehicle Window Label Verification & OEM Window Sticker for VIN: ${vin || "Pending"}`,
              },
              unit_amount: Math.round(pricing.windowStickerFinalPrice * 100),
            },
            quantity: 1,
          });
        }
        if (pricing.salvageInformationIncluded && Math.round(pricing.salvageInformationFinalPrice * 100) > 0) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Salvage & Total Loss Information Report",
                description: `Salvage & Total Loss Information for VIN: ${vin || "Pending"}`,
              },
              unit_amount: Math.round(pricing.salvageInformationFinalPrice * 100),
            },
            quantity: 1,
          });
        }
      }

      const session = await client.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/?canceled=true`,
        customer_email: email,
      });

      // Save order data directly to Firebase Firestore
      const newOrder = {
        id: session.id,
        packageName: pricing.packageName,
        packageTier: pricing.packageTier,
        packagePrice: pricing.packageOriginalPrice,
        packageOriginalPrice: pricing.packageOriginalPrice,
        windowStickerIncluded: pricing.windowStickerIncluded,
        windowStickerOriginalPrice: pricing.windowStickerOriginalPrice,
        windowStickerDiscountPercentage: pricing.windowStickerDiscountPercentage,
        windowStickerDiscountAmount: pricing.windowStickerDiscountAmount,
        windowStickerPrice: pricing.windowStickerFinalPrice,
        windowStickerFinalPrice: pricing.windowStickerFinalPrice,
        salvageInformationIncluded: pricing.salvageInformationIncluded,
        salvageInformationOriginalPrice: pricing.salvageInformationOriginalPrice,
        salvageInformationDiscountAmount: pricing.salvageInformationDiscountAmount,
        salvageInformationFinalPrice: pricing.salvageInformationFinalPrice,
        appliedOfferName: pricing.appliedOfferName,
        discountAmount: pricing.totalDiscount,
        totalDiscount: pricing.totalDiscount,
        combinedSubtotal: Number(
          (pricing.packageOriginalPrice + pricing.windowStickerOriginalPrice + pricing.salvageInformationOriginalPrice).toFixed(2)
        ),
        amount: pricing.finalAmountPaid,
        finalAmountPaid: pricing.finalAmountPaid,
        vin,
        email,
        firstName,
        lastName,
        phone: phone || "",
        country: country || "United States",
        createdAt: new Date().toISOString(),
        status: "pending",
        policyAgreed: !!policyAgreed,
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
    const {
      packageName,
      includeWindowSticker,
      vin,
      email,
      firstName,
      lastName,
      country,
      policyAgreed,
      phone,
    } = req.body;
    const client = getStripe();

    if (!client) {
      return res
        .status(500)
        .json({ error: "Stripe is not configured on the server." });
    }

    try {
      const pricing = calculateOrderPricing(packageName, includeWindowSticker);
      const totalAmountCents = Math.round(pricing.finalAmountPaid * 100);

      const paymentIntent = await client.paymentIntents.create({
        amount: totalAmountCents,
        currency: "usd",
        receipt_email: email,
        description: `${pricing.packageName}${pricing.windowStickerIncluded ? " + Window Sticker" : ""}${pricing.salvageInformationIncluded ? " + Salvage Information" : ""} for VIN: ${vin || "Pending"}`,
        metadata: {
          packageName: pricing.packageName,
          packageTier: pricing.packageTier,
          packagePrice: pricing.packageOriginalPrice.toFixed(2),
          packageOriginalPrice: pricing.packageOriginalPrice.toFixed(2),
          windowStickerIncluded: pricing.windowStickerIncluded ? "true" : "false",
          windowStickerOriginalPrice: pricing.windowStickerOriginalPrice.toFixed(2),
          windowStickerDiscountPercentage: pricing.windowStickerDiscountPercentage.toString(),
          windowStickerDiscountAmount: pricing.windowStickerDiscountAmount.toFixed(2),
          windowStickerFinalPrice: pricing.windowStickerFinalPrice.toFixed(2),
          salvageInformationIncluded: pricing.salvageInformationIncluded ? "true" : "false",
          salvageInformationOriginalPrice: pricing.salvageInformationOriginalPrice.toFixed(2),
          salvageInformationFinalPrice: pricing.salvageInformationFinalPrice.toFixed(2),
          appliedOfferName: pricing.appliedOfferName,
          totalDiscount: pricing.totalDiscount.toFixed(2),
          finalAmountPaid: pricing.finalAmountPaid.toFixed(2),
          vin: vin || "Pending",
          firstName,
          lastName,
          country: country || "United States",
        },
      });

      // Save order data directly to Firebase Firestore
      const newOrder = {
        id: paymentIntent.id,
        packageName: pricing.packageName,
        packageTier: pricing.packageTier,
        packagePrice: pricing.packageOriginalPrice,
        packageOriginalPrice: pricing.packageOriginalPrice,
        windowStickerIncluded: pricing.windowStickerIncluded,
        windowStickerOriginalPrice: pricing.windowStickerOriginalPrice,
        windowStickerDiscountPercentage: pricing.windowStickerDiscountPercentage,
        windowStickerDiscountAmount: pricing.windowStickerDiscountAmount,
        windowStickerPrice: pricing.windowStickerFinalPrice,
        windowStickerFinalPrice: pricing.windowStickerFinalPrice,
        salvageInformationIncluded: pricing.salvageInformationIncluded,
        salvageInformationOriginalPrice: pricing.salvageInformationOriginalPrice,
        salvageInformationDiscountAmount: pricing.salvageInformationDiscountAmount,
        salvageInformationFinalPrice: pricing.salvageInformationFinalPrice,
        appliedOfferName: pricing.appliedOfferName,
        discountAmount: pricing.totalDiscount,
        totalDiscount: pricing.totalDiscount,
        combinedSubtotal: Number(
          (pricing.packageOriginalPrice + pricing.windowStickerOriginalPrice + pricing.salvageInformationOriginalPrice).toFixed(2)
        ),
        amount: pricing.finalAmountPaid,
        finalAmountPaid: pricing.finalAmountPaid,
        vin,
        email,
        firstName,
        lastName,
        phone: phone || "",
        country: country || "United States",
        createdAt: new Date().toISOString(),
        status: "pending",
        policyAgreed: !!policyAgreed,
      };

      await db.collection("orders").add(newOrder);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Confirm Order Payment (Stripe Checkout return / Intent confirmation)
  app.post("/api/orders/:id/confirm-payment", async (req, res) => {
    const { id } = req.params;
    try {
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const client = getStripe();
      let isPaid = true;

      if (client && id.startsWith("cs_")) {
        try {
          const session = await client.checkout.sessions.retrieve(id);
          isPaid = session.payment_status === "paid";
        } catch (stripeErr) {
          console.warn("Could not verify session with Stripe:", stripeErr);
        }
      } else if (client && id.startsWith("pi_")) {
        try {
          const intent = await client.paymentIntents.retrieve(id);
          isPaid = intent.status === "succeeded";
        } catch (stripeErr) {
          console.warn("Could not verify intent with Stripe:", stripeErr);
        }
      }

      if (isPaid) {
        const fbDoc = querySnapshot.docs[0];
        const docRef = db.collection("orders").doc(fbDoc.id);
        const currentData = fbDoc.data() || {};
        const completedAt = currentData.completedAt || new Date().toISOString();
        await docRef.update({
          status: "completed",
          completedAt,
        });
        return res.json({ success: true, status: "completed", completedAt });
      }

      res.json({ success: false, message: "Payment not completed yet" });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
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
    const { status, reportStatus, completedAt, reportUploadedAt } = req.body;

    // Update in Firebase Firestore
    try {
      const querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const fbDoc = querySnapshot.docs[0];
      const docRef = db.collection("orders").doc(fbDoc.id);
      const currentData = fbDoc.data() || {};
      const updates: any = {};
      if (status !== undefined) {
        updates.status = status;
        if (status.toLowerCase() === "completed") {
          updates.completedAt = completedAt || currentData.completedAt || new Date().toISOString();
        }
      }
      if (reportStatus !== undefined) {
        updates.reportStatus = reportStatus;
        if (reportStatus === "sent" && !currentData.reportUploadedAt) {
          updates.reportUploadedAt = reportUploadedAt || new Date().toISOString();
        }
      }
      if (completedAt !== undefined) updates.completedAt = completedAt;
      if (reportUploadedAt !== undefined) updates.reportUploadedAt = reportUploadedAt;
      
      await docRef.update(updates);
      res.json({ success: true, ...updates });
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
      const reportUploadedAt = new Date().toISOString();
      await docRef.update({
        reportFileName: fileName,
        reportFilePath: secureUrl,
        reportStatus: "sent",
        reportUploadedAt: reportUploadedAt
      });

      res.json({ success: true, reportFileName: fileName, reportFilePath: secureUrl, reportUploadedAt });
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
        reportUploadedAt: null,
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
    const baseUrl = (process.env.APP_URL || "https://www.allvinreport.com").replace(/\/+$/, "");
    const today = new Date().toISOString().split("T")[0];
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#comparison</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#platinum</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#diamond</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#ruby</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#sapphire</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#basic</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#gold</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#premium</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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

// Import the functions you need from the SDKs you need
import express from "express";

import path from "path";
import { fileURLToPath } from "url";
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

const SHOPIFY_CHECKOUT_URLS: Record<string, string> = {
  basic:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbShVIAGxfnnXeTyvjWVS/en-gb?_r=AQAB1mpsz4QVa6nx2eupX1FiP0Fhefl6nUoqz2kbwxfOuhZrEREX&preview_theme_id=206218363222&skip_shop_pay=true",
  gold:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbLlkoQr8G2oioGG0xySe/en-gb?_r=AQABEnt87EeEOAaDLxETwLXQZmoW_CNwQ_6HNnPpGCh8ms-4EbJs&auto_redirect=false&edge_redirect=true&preview_theme_id=206218363222&skip_shop_pay=true",
  platinum:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbLfWQ8ag98ZhWBV7c8Ns/en-gb?_r=AQABJf5a2oZMwP-Fl4Husmu13Pu3Sl8nSeoQx_oSQuq0wyV00OLV&auto_redirect=false&edge_redirect=true&preview_theme_id=206218363222&skip_shop_pay=true",
  diamond:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbLboINGp4KV5G3RNqtOi/en-gb?_r=AQAB9IZBX3QCWnqMAfdqDPMX36FeACYlqvaXsLvkzq3bx30EqArW&auto_redirect=false&edge_redirect=true&preview_theme_id=206218363222&skip_shop_pay=true",
  ruby:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbLboINGp4KV5G3RNqtOi/en-gb?_r=AQAB9IZBX3QCWnqMAfdqDPMX36FeACYlqvaXsLvkzq3bx30EqArW&auto_redirect=false&edge_redirect=true&preview_theme_id=206218363222&skip_shop_pay=true",
  sapphire:
    "https://a0hvpi-nr.myshopify.com/checkouts/cn/hWNJbLboINGp4KV5G3RNqtOi/en-gb?_r=AQAB9IZBX3QCWnqMAfdqDPMX36FeACYlqvaXsLvkzq3bx30EqArW&auto_redirect=false&edge_redirect=true&preview_theme_id=206218363222&skip_shop_pay=true",
};

  // API: Create Checkout Session (Shopify Checkout)
  app.post("/api/create-checkout-session", async (req, res) => {
    const {
      packageName,
      includeWindowSticker,
      vin,
      email,
      firstName,
      lastName,
      country,
      policyAgreed,
      purchaseDecisionAgreed,
      inspectionReportAgreed,
      phone,
    } = req.body;

    try {
      const pricing = calculateOrderPricing(packageName, false);
      const pkgLower = (pricing.packageTier || packageName || "").toLowerCase();
      const checkoutUrl = SHOPIFY_CHECKOUT_URLS[pkgLower] || SHOPIFY_CHECKOUT_URLS.basic;

      const orderCode = `shopify_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newOrder = {
        id: orderCode,
        orderCode: orderCode,
        paymentProvider: "shopify",
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
        currency: "USD",
        vin: vin || "Pending",
        email: email || "",
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || "",
        country: country || "United States",
        createdAt: new Date().toISOString(),
        status: "pending",
        checkoutUrl,
        policyAgreed: !!policyAgreed,
        purchaseDecisionAgreed: !!purchaseDecisionAgreed,
        inspectionReportAgreed: !!inspectionReportAgreed,
      };

      await db.collection("orders").add(newOrder);

      return res.json({ url: checkoutUrl, orderCode });
    } catch (error: any) {
      console.error("Payment Gateway Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Confirm Order Payment
  app.post("/api/orders/:id/confirm-payment", async (req, res) => {
    const { id } = req.params;
    const transactionId = (req.query.t || req.body.t || "") as string;

    try {
      let querySnapshot = await db.collection("orders").where("id", "==", id).get();
      if (querySnapshot.empty) {
        querySnapshot = await db.collection("orders").where("orderCode", "==", id).get();
      }

      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const fbDoc = querySnapshot.docs[0];
      const docRef = db.collection("orders").doc(fbDoc.id);
      const currentData = fbDoc.data() || {};
      const completedAt = currentData.completedAt || new Date().toISOString();
      const updateData: any = {
        status: "completed",
        completedAt,
      };
      if (transactionId) {
        updateData.transactionId = transactionId;
      }

      await docRef.update(updateData);
      return res.json({ success: true, status: "completed", completedAt });
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
      import("vite")
        .then(({ createServer: createViteServer }) => {
          return createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
          }).then((vite) => {
            app.use(vite.middlewares);
            app.listen(PORT, "0.0.0.0", () => {
              console.log(`Server running on http://localhost:${PORT}`);
            });
          });
        })
        .catch((err) => {
          console.error("Vite setup error:", err);
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

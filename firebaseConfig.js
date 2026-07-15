import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof module !== "undefined" && module.filename ? module.filename : "");
const __dirname = path.dirname(__filename);

let app;
if (admin.apps.length === 0) {
  const localKeyPath = path.join(__dirname, "serviceAccountKey.json");
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (fs.existsSync(localKeyPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf8"));
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`Firebase Admin initialized via local serviceAccountKey.json file (Project: ${serviceAccount.project_id}).`);
    } catch (e) {
      console.error("Failed to parse local serviceAccountKey.json:", e);
    }
  }
  
  if (!app && serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT environment variable (Project: ${serviceAccount.project_id}).`);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", e);
    }
  }
  
  if (!app) {
    app = admin.initializeApp({
      projectId: "VinTrust-15d6f"
    });
    console.log("Firebase Admin initialized with project ID VinTrust-15d6f (no credential).");
  }
} else {
  app = admin.app();
}

const db = admin.firestore(app);

export { app, db };



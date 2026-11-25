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
  const namedKeyPath = path.join(__dirname, "trustedvin-15d6f-firebase-adminsdk-fbsvc-87ad51ceb5.json");
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  const keyFileToUse = fs.existsSync(localKeyPath)
    ? localKeyPath
    : fs.existsSync(namedKeyPath)
      ? namedKeyPath
      : null;

  if (keyFileToUse) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(keyFileToUse, "utf8"));
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`Firebase Admin initialized via local ${path.basename(keyFileToUse)} file (Project: ${serviceAccount.project_id}).`);
    } catch (e) {
      console.error(`Failed to parse local ${path.basename(keyFileToUse)}:`, e);
    }
  }
  
  if (!app && serviceAccountKey) {
    try {
      let serviceAccount = typeof serviceAccountKey === "string" ? JSON.parse(serviceAccountKey) : serviceAccountKey;
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
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
      projectId: "trustedvin-15d6f"
    });
    console.log("Firebase Admin initialized with project ID trustedvin-15d6f (no credential).");
  }
} else {
  app = admin.app();
}

const db = admin.firestore(app);

export { app, db };



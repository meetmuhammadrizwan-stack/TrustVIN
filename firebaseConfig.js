import admin from "firebase-admin";

let app;
if (admin.apps.length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "VinTrust-15d6f"
      });
      console.log("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", e);
      app = admin.initializeApp({
        projectId: "VinTrust-15d6f"
      });
    }
  } else {
    app = admin.initializeApp({
      projectId: "VinTrust-15d6f"
    });
    console.log("Firebase Admin initialized with project ID VinTrust-15d6f.");
  }
} else {
  app = admin.app();
}

const db = admin.firestore(app);

export { app, db };


// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
// If you plan to use Firestore, Auth, etc. import them here:
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLTDUp3BBCo5YFASNk-eXm6Kt0s447RyM",
  authDomain: "chat-app-33d9c.firebaseapp.com",
  projectId: "chat-app-33d9c",
  storageBucket: "chat-app-33d9c.firebasestorage.app",
  messagingSenderId: "707966852520",
  appId: "1:707966852520:web:81af337537936543a7519d"
};

// To avoid re-initializing on every render in Next.js, check if an app is already initialized:
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Optionally export services you need, e.g. Firestore or Auth
// export const db = getFirestore(app);
// export const auth = getAuth(app);

export default app;

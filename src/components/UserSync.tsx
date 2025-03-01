// components/UserSync.tsx
"use client";
import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "../lib/firebaseClient";

export default function UserSync() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      const db = getFirestore(app);
      const userRef = doc(db, "users", user.id);

      // Convert publicMetadata to a JSON-safe object
      const safePublicMetadata = JSON.parse(JSON.stringify(user.publicMetadata || {}));

      const userData = {
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        profileImage: user.imageUrl || "",
        createdAtClerk: user.createdAt?.toString() || "",
        updatedAtClerk: user.updatedAt?.toString() || "",
        publicMetadata: safePublicMetadata,
        updatedAt: new Date().toISOString(),
      };

      setDoc(userRef, userData, { merge: true })
        .then(() => {
          console.log("User record upserted in Firestore with sanitized fields");
        })
        .catch((error) => {
          console.error("Error upserting user:", error);
        });
    }
  }, [isSignedIn, user]);

  return null;
}

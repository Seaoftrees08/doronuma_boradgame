import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, connectFirestoreEmulator } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    connectFirestoreEmulator(db, host, 8080);
  } catch (e) {
    console.warn("Firestore emulator already connected:", e);
  }
}

export { doc, getDoc, setDoc, updateDoc, collection, onSnapshot };

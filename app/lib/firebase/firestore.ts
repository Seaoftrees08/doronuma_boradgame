import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, connectFirestoreEmulator } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch (e) {
    console.warn("Firestore emulator already connected:", e);
  }
}

export { doc, getDoc, setDoc, updateDoc, collection, onSnapshot };

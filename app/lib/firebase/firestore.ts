import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

export { doc, getDoc, setDoc, updateDoc, collection, onSnapshot };

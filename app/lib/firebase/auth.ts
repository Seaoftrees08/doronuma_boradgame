import { getAuth, signInAnonymously, onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

export const signInAnonymouslyUser = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
};

export { onAuthStateChanged };

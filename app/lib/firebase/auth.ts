import { getAuth, signInAnonymously, onAuthStateChanged, browserLocalPersistence, setPersistence, connectAuthEmulator } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  } catch (e) {
    console.warn("Auth emulator already connected:", e);
  }
}

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

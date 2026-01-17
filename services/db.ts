
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs
} from "firebase/firestore";
import { 
  getAuth, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { Habit, Completion } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey === import.meta.env.VITE_FIREBASE_API_KEY
};

const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { auth, db };

export const dbService = {
  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    if (!auth) {
      console.warn("Auth not initialized: Keys missing in services/db.ts");
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  async createProfile(userId: string, email: string) {
    if (!db) return;
    try {
      await setDoc(doc(db, "profiles", userId), {
        email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Profile sync failed:", e);
    }
  },

  subscribeToHabits(userId: string, onUpdate: (habits: Habit[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, "habits"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];
      onUpdate(habits);
    }, (error) => {
      console.error("Habit subscription error:", error);
    });
  },

  subscribeToCompletions(userId: string, onUpdate: (completions: Completion[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, "completions"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Completion[];
      onUpdate(completions);
    }, (error) => {
      console.error("Completions subscription error:", error);
    });
  },

  async addHabit(userId: string, habit: Omit<Habit, 'id'>): Promise<string> {
    if (!db) throw new Error("Backend not connected. Check your keys in services/db.ts");
    const docRef = await addDoc(collection(db, "habits"), { 
      ...habit, 
      userId,
      updatedAt: new Date().toISOString() 
    });
    return docRef.id;
  },

  async updateHabit(habitId: string, habit: Partial<Habit>): Promise<void> {
    if (!db) throw new Error("Backend not connected.");
    const habitRef = doc(db, "habits", habitId);
    await updateDoc(habitRef, {
      ...habit,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteHabit(habitId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "habits", habitId));
  },

  async addCompletion(userId: string, completion: Omit<Completion, 'id'>): Promise<string> {
    if (!db) throw new Error("Backend not connected.");
    const docRef = await addDoc(collection(db, "completions"), { ...completion, userId });
    return docRef.id;
  },

  async removeCompletion(habitId: string, date: string): Promise<void> {
    if (!db) return;
    const q = query(
      collection(db, "completions"), 
      where("habitId", "==", habitId), 
      where("date", "==", date)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "completions", d.id)));
    await Promise.all(deletePromises);
  }
};

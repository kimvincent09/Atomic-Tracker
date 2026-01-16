
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  updateDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { Habit, Completion } from "../types";

// IMPORTANT: Replace with your actual Firebase project config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSy_demo_key",
  authDomain: "atomic-habits-demo.firebaseapp.com",
  projectId: "atomic-habits-demo",
  storageBucket: "atomic-habits-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth };

export const dbService = {
  // --- Auth Helper ---
  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // --- Habits ---
  async getHabits(userId: string): Promise<Habit[]> {
    try {
      const q = query(collection(db, "habits"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];
    } catch (e) {
      console.warn("Firestore error", e);
      return [];
    }
  },

  async addHabit(userId: string, habit: Omit<Habit, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "habits"), { ...habit, userId });
    return docRef.id;
  },

  async deleteHabit(habitId: string): Promise<void> {
    await deleteDoc(doc(db, "habits", habitId));
    const q = query(collection(db, "completions"), where("habitId", "==", habitId));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (d) => await deleteDoc(doc(db, "completions", d.id)));
  },

  // --- Completions ---
  async getCompletions(userId: string): Promise<Completion[]> {
    try {
      const q = query(collection(db, "completions"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Completion[];
    } catch (e) {
      return [];
    }
  },

  async addCompletion(userId: string, completion: Omit<Completion, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "completions"), { ...completion, userId });
    return docRef.id;
  },

  async removeCompletion(habitId: string, date: string): Promise<void> {
    const q = query(
      collection(db, "completions"), 
      where("habitId", "==", habitId), 
      where("date", "==", date)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(async (d) => await deleteDoc(doc(db, "completions", d.id)));
  }
};

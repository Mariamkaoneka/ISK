import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OwnerSettings, AuditLogEntry, InterpretationRating, AppHitLog, InterpretationResponse } from '../types';

// Initialize Firebase App instance
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

// Helper for Anonymous sign-in for tracking sessions smoothly
export async function ensureAuth(): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          console.warn('Anonymous auth note:', err);
          resolve(null);
        }
      }
    });
  });
}

// ----------------- SETTINGS PERSISTENCE -----------------
export async function saveSettingsToFirestore(settings: OwnerSettings): Promise<boolean> {
  try {
    if (!db) return false;
    const settingsDocRef = doc(db, 'settings', 'general');
    await setDoc(settingsDocRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    return false;
  }
}

export async function loadSettingsFromFirestore(): Promise<OwnerSettings | null> {
  try {
    if (!db) return null;
    const settingsDocRef = doc(db, 'settings', 'general');
    const snapshot = await getDoc(settingsDocRef);
    if (snapshot.exists()) {
      return snapshot.data() as OwnerSettings;
    }
  } catch (error) {
    console.warn('Could not load settings from Firestore:', error);
  }
  return null;
}

// ----------------- AUDIT LOGS PERSISTENCE -----------------
export async function logAuditToFirestore(entry: Omit<AuditLogEntry, 'id'> & { id?: string }): Promise<void> {
  try {
    if (!db) return;
    const logsCol = collection(db, 'auditLogs');
    await addDoc(logsCol, {
      ...entry,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Could not save audit log to Firestore:', error);
  }
}

export async function fetchAuditLogsFromFirestore(max = 50): Promise<AuditLogEntry[]> {
  try {
    if (!db) return [];
    const logsCol = collection(db, 'auditLogs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as AuditLogEntry));
  } catch (error) {
    console.warn('Error fetching audit logs from Firestore:', error);
    return [];
  }
}

// ----------------- RATINGS & PATIENT FEEDBACK -----------------
export async function saveRatingToFirestore(rating: Omit<InterpretationRating, 'id'>): Promise<string | null> {
  try {
    if (!db) return null;
    const ratingsCol = collection(db, 'ratings');
    const docRef = await addDoc(ratingsCol, {
      ...rating,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving rating to Firestore:', error);
    return null;
  }
}

export async function fetchRatingsFromFirestore(max = 50): Promise<InterpretationRating[]> {
  try {
    if (!db) return [];
    const ratingsCol = collection(db, 'ratings');
    const q = query(ratingsCol, orderBy('timestamp', 'desc'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as InterpretationRating));
  } catch (error) {
    console.warn('Error fetching ratings from Firestore:', error);
    return [];
  }
}

// ----------------- SAVED PATIENT INTERPRETATIONS -----------------
export interface SavedInterpretationRecord {
  id?: string;
  userId?: string;
  timestamp: number;
  modality: string;
  bodyRegion: string;
  overallSummary_sw: string;
  overallSummary_en: string;
  data: InterpretationResponse;
}

export async function saveInterpretationToHistory(
  record: Omit<SavedInterpretationRecord, 'id'>
): Promise<string | null> {
  try {
    if (!db) return null;
    const user = auth.currentUser;
    const colRef = collection(db, 'savedInterpretations');
    const docRef = await addDoc(colRef, {
      ...record,
      userId: user?.uid || 'anonymous',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving interpretation history:', error);
    return null;
  }
}

export async function fetchSavedInterpretations(max = 20): Promise<SavedInterpretationRecord[]> {
  try {
    if (!db) return [];
    const colRef = collection(db, 'savedInterpretations');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as SavedInterpretationRecord));
  } catch (error) {
    console.warn('Error fetching saved interpretations:', error);
    return [];
  }
}

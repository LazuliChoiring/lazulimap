import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use Long Polling for better compatibility in restricted networks (bypass gRPC/WebSocket issues)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Enable Offline Persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported by browser');
    }
  });
}

export const googleProvider = new GoogleAuthProvider();

// Connection Test
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document from the server to test connection
    // Increased timeout to 10s for slower mobile networks
    const connectionPromise = getDocFromServer(doc(db, '_internal_', 'monitoring'));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('connection_timeout')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error.message === 'connection_timeout' || (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable')))) {
      console.warn("Firestore: Connection slow or restricted. Operating in optimized offline-first mode.");
    } else {
      // It's likely a 404 (not found) or 403, which indirectly confirms we reached the server
      console.log("Firestore reachability test completed.");
    }
  }
}
testConnection();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => auth.signOut();

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

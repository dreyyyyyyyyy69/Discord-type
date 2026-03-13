import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// PERMANENT FIREBASE CONFIG: Hardcoded to persist through remixes and shares.
const firebaseConfig = {
  apiKey: "AIzaSyCqQEx97EZ7ycuvr1O_RShOkvAqbJGXtDc",
  authDomain: "discord-clone-9bd56.firebaseapp.com",
  projectId: "discord-clone-9bd56",
  storageBucket: "discord-clone-9bd56.firebasestorage.app",
  messagingSenderId: "244237941190",
  appId: "1:244237941190:web:396868064cfdbccb4e9ac7",
  measurementId: "G-YLB5XMS5H5"
};

const firestoreDatabaseId = "(default)";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to local to stay logged in across sessions
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((e) => console.error("Failed to set persistence", e));
}

const db = getFirestore(app, firestoreDatabaseId);
const storage = getStorage(app);

// Connection test
if (typeof window !== "undefined") {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Firebase connection failed. Check your project settings.");
      }
    }
  };
  testConnection();
}

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
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  // Safe stringify to avoid circular structure errors
  const getSafeString = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return; // Discard circular reference
        }
        cache.add(value);
      }
      return value;
    });
  };

  const errorString = getSafeString(errInfo);
  console.error('Firestore Error: ', errorString);
  throw new Error(errorString);
}

export { app, auth, db, storage };

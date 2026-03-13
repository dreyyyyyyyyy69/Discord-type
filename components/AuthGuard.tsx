'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { useStore } from '@/store/useStore';
import LoginPage from './LoginPage';
import ProfileSetup from './ProfileSetup';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, setUser, profile, setProfile, setNotifications } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        // Fetch profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as any);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile]);

  // Real-time profile listener if logged in
  useEffect(() => {
    if (!user || !db) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as any);
      }
    });

    return () => unsubscribe();
  }, [user, setProfile]);

  // Global data fetchers
  const { setWorkspaces, setAddons, setFriends, setIncomingRequests, setOutgoingRequests } = useStore();

  // Real-time workspaces listener
  useEffect(() => {
    if (!user || !db) return;
    
    const q = query(collection(db, "workspaces"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const userWorkspaces = ws.filter(w => {
        if (w.memberIds && w.memberIds.includes(user.uid)) return true;
        if (w.members && w.members.some((m: any) => m.id === user.uid || m.uid === user.uid)) return true;
        return false;
      });
      setWorkspaces(userWorkspaces);
    });

    return () => unsubscribe();
  }, [user, setWorkspaces]);

  // Real-time addons listener
  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, "addons"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAddons(ads);
    });

    return () => unsubscribe();
  }, [user, setAddons]);

  // Real-time friends listener
  useEffect(() => {
    if (!user || !db) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const friendIds = userData.friends || [];
        const incomingIds = userData.incomingRequests || [];
        const outgoingIds = userData.outgoingRequests || [];
        
        // Fetch friend profiles
        const friendProfiles = await Promise.all(friendIds.map(async (id: string) => {
          const fDoc = await getDoc(doc(db, "users", id));
          return fDoc.exists() ? { id: fDoc.id, ...fDoc.data() } : null;
        }));
        
        // Fetch incoming request profiles
        const incomingProfiles = await Promise.all(incomingIds.map(async (id: string) => {
          const fDoc = await getDoc(doc(db, "users", id));
          return fDoc.exists() ? { id: fDoc.id, ...fDoc.data() } : null;
        }));
        
        setFriends(friendProfiles.filter(p => p !== null) as any);
        setIncomingRequests(incomingProfiles.filter(p => p !== null) as any);
        setOutgoingRequests(outgoingIds);
      }
    });

    return () => unsubscribe();
  }, [user, setFriends, setIncomingRequests, setOutgoingRequests]);

  // Real-time notifications listener
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user, setNotifications]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#313338]/40 backdrop-blur-md flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#5865F2] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!profile) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
}

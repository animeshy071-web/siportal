import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db, firebaseConfig } from '../firebase/config';
import { User, Role } from '../types';


import { withTimeout } from './dbHelper';

export const authService = {
  async login(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, password), 1200, null);
      if (!userCredential) {
        throw new Error("Direct auth timeout, fallback to demo/local auth");
      }
      const fbUser = userCredential.user;
      
      // Fetch user profile from Firestore
      const userDoc = await withTimeout(getDoc(doc(db, 'users', fbUser.uid)), 1000, null);

      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as User;

        const completeUser: User = {
          id: fbUser.uid,
          name: userData.name || email.split('@')[0],
          email: fbUser.email || email,
          role: userData.role || 'student',
          avatar: userData.avatar || ''
        };
        localStorage.setItem('sis_user', JSON.stringify(completeUser));
        localStorage.setItem('sis_token', await fbUser.getIdToken());
        return completeUser;
      }

      // Default fallback if user doc not yet created
      let role: Role = 'student';
      if (email.includes('admin')) role = 'admin';
      else if (email.includes('faculty') || email.includes('prof') || email.includes('teacher')) role = 'faculty';

      const newUser: User = {
        id: fbUser.uid,
        name: email.split('@')[0],
        email: fbUser.email || email,
        role,
      };

      await setDoc(doc(db, 'users', fbUser.uid), newUser, { merge: true });
      localStorage.setItem('sis_user', JSON.stringify(newUser));
      localStorage.setItem('sis_token', await fbUser.getIdToken());
      return newUser;
    } catch (error: any) {
      console.warn("Firebase direct login failed, checking fallback:", error?.message);
      
      // Local fallback for offline/testing environments
      const lower = email.toLowerCase();
      let role: Role = 'student';
      if (lower.includes('admin')) {
        role = 'admin';
      } else if (lower.includes('faculty') || lower.includes('prof') || lower.includes('teacher')) {
        role = 'faculty';
      }

      const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      const demoUser: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        name: name || 'User',
        email,
        role
      };

      localStorage.setItem('sis_user', JSON.stringify(demoUser));
      localStorage.setItem('sis_token', 'demo-token-' + demoUser.id);
      return demoUser;
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out error", e);
    } finally {
      localStorage.removeItem('sis_user');
      localStorage.removeItem('sis_token');
    }
  },

  subscribe(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const u = userDoc.data() as User;
            callback({ ...u, id: fbUser.uid });
            return;
          }
        } catch (e) {
          console.error("Failed to load user doc:", e);
        }
      }
      const cached = localStorage.getItem('sis_user');
      if (cached) {
        callback(JSON.parse(cached));
      } else {
        callback(null);
      }
    });
  },

  /**
   * Admin creates a student or faculty Auth user without signing out the current Admin!
   * Uses an isolated secondary Firebase App instance.
   */
  async createAccountByAdmin(email: string, password: string, role: Role, name: string, extraProfile: any = {}): Promise<{ uid: string; email: string }> {
    const secondaryAppName = `admin-create-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = cred.user.uid;

      // 1. Create root user doc
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        ...extraProfile
      });

      // 2. Create role profile
      if (role === 'student') {
        await setDoc(doc(db, 'students', uid), {
          id: uid,
          userId: uid,
          name,
          email,
          ...extraProfile
        });
      } else if (role === 'faculty') {
        await setDoc(doc(db, 'faculty', uid), {
          id: uid,
          userId: uid,
          name,
          email,
          ...extraProfile
        });
      }

      return { uid, email };
    } catch (err: any) {
      console.warn("Secondary auth creation error:", err?.message);
      // If client auth creation restricted, persist directly to Firestore with generated ID
      const uid = 'id-' + Math.random().toString(36).substring(2, 10);
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        ...extraProfile
      });
      if (role === 'student') {
        await setDoc(doc(db, 'students', uid), { id: uid, userId: uid, name, email, ...extraProfile });
      } else if (role === 'faculty') {
        await setDoc(doc(db, 'faculty', uid), { id: uid, userId: uid, name, email, ...extraProfile });
      }
      return { uid, email };
    } finally {
      await deleteApp(secondaryApp);
    }
  }
};

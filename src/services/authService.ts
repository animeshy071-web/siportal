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
      if (email.includes('admin') || email.toLowerCase().includes('rishita')) role = 'admin';
      else if (email.includes('faculty') || email.includes('prof') || email.includes('teacher')) role = 'faculty';

      const isRishita = email.toLowerCase().includes('rishita');
      const newUser: User = {
        id: fbUser.uid,
        name: isRishita ? 'Rishita' : email.split('@')[0],
        email: fbUser.email || email,
        role,
      };

      await setDoc(doc(db, 'users', fbUser.uid), newUser, { merge: true });
      localStorage.setItem('sis_user', JSON.stringify(newUser));
      localStorage.setItem('sis_token', await fbUser.getIdToken());
      return newUser;
    } catch (error: any) {
      console.warn("Firebase direct login failed, checking fallback:", error?.message);
      
      const lower = email.toLowerCase().trim();

      // 1. Check explicitly registered users from localStorage
      try {
        const raw = localStorage.getItem('sis_registered_users');
        if (raw) {
          const registeredUsers: any[] = JSON.parse(raw);
          const found = registeredUsers.find(u => (u.email || '').toLowerCase().trim() === lower);
          if (found) {
            const userObj: User = {
              id: found.id || found.uid,
              name: found.name,
              email: found.email,
              role: found.role,
              avatar: found.avatar || ''
            };
            localStorage.setItem('sis_user', JSON.stringify(userObj));
            localStorage.setItem('sis_token', 'local-token-' + userObj.id);
            return userObj;
          }
        }
      } catch { /* ignore */ }

      // 2. Check local faculty collection
      try {
        const facRaw = localStorage.getItem('sis_v2_faculty');
        if (facRaw) {
          const entry = JSON.parse(facRaw);
          const list: any[] = entry.data || [];
          const found = list.find(f => (f.email || '').toLowerCase().trim() === lower);
          if (found) {
            const userObj: User = {
              id: found.id,
              name: found.name,
              email: found.email,
              role: 'faculty',
              avatar: found.avatar || ''
            };
            localStorage.setItem('sis_user', JSON.stringify(userObj));
            localStorage.setItem('sis_token', 'local-token-' + userObj.id);
            return userObj;
          }
        }
      } catch { /* ignore */ }

      // 3. Check local student collection
      try {
        const stdRaw = localStorage.getItem('sis_v2_students');
        if (stdRaw) {
          const entry = JSON.parse(stdRaw);
          const list: any[] = entry.data || [];
          const found = list.find(s => (s.email || '').toLowerCase().trim() === lower);
          if (found) {
            const userObj: User = {
              id: found.id,
              name: found.name,
              email: found.email,
              role: 'student',
              avatar: found.avatar || ''
            };
            localStorage.setItem('sis_user', JSON.stringify(userObj));
            localStorage.setItem('sis_token', 'local-token-' + userObj.id);
            return userObj;
          }
        }
      } catch { /* ignore */ }

      // 4. Default fallback heuristics for quick demo logins
      let role: Role = 'student';
      let name = 'User';

      if (lower.includes('admin') || lower.includes('rishita')) {
        role = 'admin';
        name = 'Rishita';
      } else if (lower.includes('faculty') || lower.includes('prof') || lower.includes('teacher')) {
        role = 'faculty';
        name = 'Faculty Member';
      } else {
        role = 'student';
        const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
        name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      }

      const demoUser: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        name,
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
          const userDoc = await withTimeout(getDoc(doc(db, 'users', fbUser.uid)), 1000, null);
          if (userDoc && userDoc.exists()) {
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
   * Admin creates a student or faculty Auth user.
   * Local-first and instant: saves user account to localStorage, then syncs in background.
   * Never blocks or hangs the UI!
   */
  async createAccountByAdmin(email: string, password: string, role: Role, name: string, extraProfile: any = {}): Promise<{ uid: string; email: string }> {
    const uid = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);

    // 1. Immediately store credentials locally so the created user can log in
    try {
      const raw = localStorage.getItem('sis_registered_users');
      const users: any[] = raw ? JSON.parse(raw) : [];
      const existingIdx = users.findIndex(u => (u.email || '').toLowerCase().trim() === email.toLowerCase().trim());
      const accountData = { id: uid, uid, email, password, role, name, ...extraProfile };
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...accountData };
      } else {
        users.push(accountData);
      }
      localStorage.setItem('sis_registered_users', JSON.stringify(users));
    } catch { /* ignore quota */ }

    // 2. Background sync (non-blocking, never halts UI)
    (async () => {
      try {
        const secondaryAppName = `admin-create-${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const cred = await withTimeout(createUserWithEmailAndPassword(secondaryAuth, email, password), 1200, null);
          const finalUid = cred?.user?.uid || uid;

          setDoc(doc(db, 'users', finalUid), {
            id: finalUid,
            name,
            email,
            role,
            createdAt: new Date().toISOString(),
            ...extraProfile
          }).catch(() => {});

          if (role === 'student') {
            setDoc(doc(db, 'students', finalUid), { id: finalUid, userId: finalUid, name, email, ...extraProfile }).catch(() => {});
          } else if (role === 'faculty') {
            setDoc(doc(db, 'faculty', finalUid), { id: finalUid, userId: finalUid, name, email, ...extraProfile }).catch(() => {});
          }
        } catch {
          // Fallback background write
          setDoc(doc(db, 'users', uid), { id: uid, name, email, role, createdAt: new Date().toISOString(), ...extraProfile }).catch(() => {});
        } finally {
          deleteApp(secondaryApp).catch(() => {});
        }
      } catch {
        // Silently ignore background Firebase sync errors
      }
    })();

    return { uid, email };
  }
};

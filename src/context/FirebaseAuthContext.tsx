import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { ensureUserProfile } from '../lib/firebaseDiagnoses';

interface FirebaseAuthContextValue {
  user: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | undefined>(undefined);

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
        } catch (err) {
          console.warn('Could not sync Firestore user profile:', err);
        }
        // Non-blocking backend user sync for Cloud SQL care planner compatibility
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          }),
        }).catch(() => {});
      }
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        await ensureUserProfile(result.user);
      }
      return result.user;
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Bạn đã đóng cửa sổ đăng nhập Google.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép popup và thử lại.');
      } else {
        setAuthError(error?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        authReady,
        isSigningIn,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = (): FirebaseAuthContextValue => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return ctx;
};

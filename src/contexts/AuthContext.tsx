'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Cookies from 'js-cookie';
import { UserProfile, UserInterviewer } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  userInterviewer: UserInterviewer | null;
  isOnboardingRequired: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateUserInterviewer: (interviewer: Partial<UserInterviewer>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  userInterviewer: null,
  isOnboardingRequired: false,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInAsGuest: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
  updateUserInterviewer: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userInterviewer, setUserInterviewer] = useState<UserInterviewer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // オンボーディングが必要かどうか（非匿名ユーザーでプロフィール未完了）
  const isOnboardingRequired = !!(
    user &&
    !user.isAnonymous &&
    (!userProfile || !userProfile.onboardingCompleted)
  );

  // 認証トークン付きでAPIを呼び出すヘルパー
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const token = await currentUser.getIdToken();
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    return fetch(url, { ...options, headers });
  }, []);

  // APIからユーザーデータを取得
  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const response = await fetchWithAuth(`/api/save-profile?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile(data.profile);
        }
        if (data.interviewer) {
          setUserInterviewer(data.interviewer);
        }
        // 管理者フラグをサーバーから取得（セキュア）
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [fetchWithAuth]);

  // ユーザーデータを再取得
  const refreshUserData = useCallback(async () => {
    if (user && !user.isAnonymous) {
      await fetchUserData(user.uid);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && !user.isAnonymous) {
        await fetchUserData(user.uid);
      } else {
        setUserProfile(null);
        setUserInterviewer(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // ユーザー名を設定
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // セッション関連のCookieをクリア
      Cookies.remove('guest_session_id', { path: '/' });
      Cookies.remove('selected_interviewer', { path: '/' });
      Cookies.remove('interviewer_name', { path: '/' });
      // ユーザーデータをクリア
      setUserProfile(null);
      setUserInterviewer(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // ユーザープロフィールを更新（API経由）
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user || user.isAnonymous) return;

    try {
      const updatedProfile = {
        ...(userProfile || {}),
        ...profile,
      };

      const response = await fetchWithAuth('/api/save-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          profile: updatedProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // ユーザーのインタビュワー設定を更新（API経由）
  const updateUserInterviewer = async (interviewer: Partial<UserInterviewer>) => {
    if (!user || user.isAnonymous) return;

    try {
      const updatedInterviewer = {
        ...(userInterviewer || {}),
        ...interviewer,
      };

      const response = await fetchWithAuth('/api/save-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          interviewer: updatedInterviewer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save interviewer settings');
      }

      setUserInterviewer(updatedInterviewer as UserInterviewer);
    } catch (error) {
      console.error('Error updating user interviewer:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userProfile,
    userInterviewer,
    isOnboardingRequired,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    signOut,
    updateUserProfile,
    updateUserInterviewer,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

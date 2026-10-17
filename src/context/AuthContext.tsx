'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  signInWithGoogle: (email?: string, name?: string) => void;
  signInWithGoogleCredential: (credential: string) => void;
  signInWithGoogleManual: (profile: UserProfile) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'marquee_google_session_v3';
const CLIENT_ID_KEY = 'marquee_google_client_id';

// Default fallback client ID (or configured via environment)
const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleClientId, setGoogleClientIdState] = useState<string>(ENV_CLIENT_ID);

  useEffect(() => {
    // Check saved client ID
    try {
      const storedClientId = localStorage.getItem(CLIENT_ID_KEY);
      if (storedClientId && storedClientId.trim()) {
        setGoogleClientIdState(storedClientId.trim());
      } else if (ENV_CLIENT_ID) {
        setGoogleClientIdState(ENV_CLIENT_ID);
      }
    } catch {
      //
    }

    // Check active session
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      //
    }
    setIsLoading(false);
  }, []);

  const setGoogleClientId = (id: string) => {
    const trimmed = id.trim();
    setGoogleClientIdState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(CLIENT_ID_KEY, trimmed);
      } else {
        localStorage.removeItem(CLIENT_ID_KEY);
      }
    } catch {
      //
    }
  };

  const signInWithGoogleCredential = (credential: string) => {
    try {
      const decoded: any = jwtDecode(credential);
      const userProfile: UserProfile = {
        id: decoded.sub || `google-${Date.now()}`,
        email: decoded.email || '',
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        avatar_url: decoded.picture || undefined,
      };

      setUser(userProfile);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userProfile));
      toast.success('Authenticated with Google', {
        description: `Welcome to Marquee, ${userProfile.name}!`,
      });
    } catch {
      toast.error('Failed to decode Google authentication token');
    }
  };

  const signInWithGoogle = (email?: string, name?: string) => {
    const finalEmail = email?.trim() || 'sachin.bhattiprolu@gmail.com';
    const computedName =
      name?.trim() ||
      finalEmail.split('@')[0].charAt(0).toUpperCase() +
        finalEmail.split('@')[0].slice(1);

    const profile: UserProfile = {
      id: `google-${Date.now()}`,
      email: finalEmail,
      name: computedName,
      avatar_url:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    };

    setUser(profile);
    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
    } catch {
      //
    }
    toast.success('Signed in with Google', {
      description: `Welcome to Marquee, ${profile.name}!`,
    });
  };

  const signInWithGoogleManual = (profile: UserProfile) => {
    setUser(profile);
    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
    } catch {
      //
    }
    toast.success('Signed in', {
      description: `Welcome, ${profile.name}!`,
    });
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      //
    }
    toast.info('Signed out of Marquee');
  };

  const activeClientId = googleClientId || 'PLACEHOLDER_CLIENT_ID';

  return (
    <GoogleOAuthProvider clientId={activeClientId}>
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          googleClientId,
          setGoogleClientId,
          signInWithGoogle,
          signInWithGoogleCredential,
          signInWithGoogleManual,
          signOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

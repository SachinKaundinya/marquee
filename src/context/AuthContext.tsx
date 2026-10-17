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
  signInWithGoogle: () => void;
  signInWithGoogleCredential: (credential: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'marquee_google_session_v4';
const CLIENT_ID_KEY = 'marquee_google_client_id';

const DEFAULT_GOOGLE_CLIENT_ID =
  '96488444786-2h8vju5p7jdib9mk1kotr7qrgbglcl2a.apps.googleusercontent.com';

// Default fallback client ID (or configured via environment)
const ENV_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleClientId, setGoogleClientIdState] = useState<string>(ENV_CLIENT_ID);

  useEffect(() => {
    // 1. Check saved client ID
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

    // 2. Check if returning from Google OAuth redirect (hash containing access_token)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch userinfo from Google');
            return res.json();
          })
          .then((data) => {
            if (data && data.email) {
              const userProfile: UserProfile = {
                id: data.sub || `google-${Date.now()}`,
                email: data.email,
                name: data.name || data.email.split('@')[0],
                avatar_url: data.picture,
              };
              setUser(userProfile);
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userProfile));
              window.history.replaceState(null, '', window.location.pathname);
              toast.success('Successfully authenticated with Google', {
                description: `Welcome to Marquee, ${userProfile.name}!`,
              });
            }
          })
          .catch((err) => {
            console.error('Google token verification failed', err);
            toast.error('Google authentication failed. Please try again.');
          });
      }
    }

    // 3. Check active session
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

  const signInWithGoogle = () => {
    if (!googleClientId || googleClientId === 'PLACEHOLDER_CLIENT_ID') {
      toast.error('Google Client ID is required to open Google sign-on page');
      return;
    }
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;
    window.location.href = authUrl;
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

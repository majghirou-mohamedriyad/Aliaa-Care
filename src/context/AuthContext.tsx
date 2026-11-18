import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';

interface Profile {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userRef = useRef<User | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (!profileRef.current) {
          setProfile(null);
          profileRef.current = null;
        }
      } else {
        const prof = data as Profile;
        setProfile(prof);
        profileRef.current = prof;
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Step 1: Initialize from session immediately
    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        userRef.current = initialSession?.user ?? null;

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch {
        if (mounted) setIsLoading(false);
      } finally {
        if (mounted) {
          initialLoadedRef.current = true;
        }
      }
    };

    initialize();

    // Step 2: Listen only for actual auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      const currentUserId = userRef.current?.id;
      const newUserId = currentSession?.user?.id;

      if (event === 'SIGNED_IN') {
        const isDifferentUser = !currentUserId || currentUserId !== newUserId;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        userRef.current = currentSession?.user ?? null;

        if (currentSession?.user) {
          // Only fetch profile if user changed or profile not loaded yet
          if (isDifferentUser || !profileRef.current) {
            // Never block UI with full-screen spinner if already loaded once
            if (!initialLoadedRef.current) {
              setIsLoading(true);
            }
            await fetchProfile(currentSession.user.id);
          }
        } else {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        profileRef.current = null;
        setUser(null);
        userRef.current = null;
        setSession(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        userRef.current = currentSession?.user ?? null;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin: profile?.role === 'admin',
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

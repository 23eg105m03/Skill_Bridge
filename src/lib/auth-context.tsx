import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface Skill {
  id: string;
  name: string;
  type: 'offer' | 'want';
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  profileImage: string;
  accountType: 'student' | 'admin';
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  rating: number;
  status: 'active' | 'suspended';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (data: RegisterData) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  accountType: 'student' | 'admin';
  bio: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const [profileRes, skillsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
    ]);

    // Changed from .single() to avoid 406 errors when user doesn't exist
    if (profileRes.error || !profileRes.data || profileRes.data.length === 0) return null;
    
    const profile = profileRes.data[0];
    const skills: Skill[] = (skillsRes.data || []).map((s: { id: string; name: string; type: 'offer' | 'want' }) => ({
      id: s.id,
      name: s.name,
      type: s.type,
    }));

    return {
      id: profile.id,
      name: profile.name,
      email: '',
      bio: profile.bio || '',
      profileImage: '',
      accountType: profile.account_type,
      skillsOffered: skills.filter(s => s.type === 'offer'),
      skillsWanted: skills.filter(s => s.type === 'want'),
      rating: profile.rating || 0,
      status: profile.status || 'active',
    };
  } catch (err) {
    console.error("fetchUserProfile exception", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(async (showMessage?: string) => {
    try {
      await supabase.auth.signOut();
    } catch (e) { console.error("Sign out error", e); }
    setUser(null);
    setSession(null);
    if (showMessage) toast.error(showMessage);
  }, []);

  const loadUser = useCallback(async (sess: Session) => {
    try {
      const profile = await fetchUserProfile(sess.user.id);
      if (profile) {
        profile.email = sess.user.email || '';
        setUser(profile);
      } else {
        await clearAuth("Your profile is incomplete. Please register a new account.");
      }
    } catch {
      await clearAuth("Failed to load user profile.");
    }
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;
    
    // Failsafe timeout to prevent infinite loading spinners
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);
    
    supabase.auth.getSession().then(({ data: { session: sess }, error }) => {
      if (!mounted) return;
      if (error) {
        setLoading(false);
        return;
      }
      
      setSession(sess);
      if (sess) {
        loadUser(sess).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Auth session error", err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess) {
        // Run loadUser in the background without blocking the SDK's event loop
        loadUser(sess).catch(console.error);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (signUpError) return { error: signUpError.message };
    if (!authData.user) return { error: 'Registration failed' };

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name: data.name,
      bio: data.bio || '',
      account_type: data.accountType,
      rating: 0,
      status: 'active',
    });

    if (profileError) {
      await supabase.auth.signOut().catch(()=>{});
      return { error: profileError.message };
    }
    
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (session) await loadUser(session);
  }, [session, loadUser]);

  return (
    <AuthContext.Provider value={{ user, session, isAuthenticated: !!user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

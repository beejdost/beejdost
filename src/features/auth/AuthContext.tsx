import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import { UserProfile, PakistanProvince, FarmingType, PreferredLanguage } from '@/types';
import i18n from '@/i18n/config';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  province: PakistanProvince;
  district: string;
  tehsil?: string;
  village?: string;
  phone?: string;
  farmingType?: FarmingType;
  preferredLanguage?: PreferredLanguage;
}

export interface ProfileUpdateData {
  fullName?: string;
  phone?: string | null;
  province?: PakistanProvince;
  district?: string;
  tehsil?: string | null;
  village?: string | null;
  farmingType?: FarmingType;
  preferredLanguage?: PreferredLanguage;
  bio?: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailConfirmed: boolean;
  isSuspended: boolean;
  isAdmin: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; unconfirmed: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresEmailConfirmation?: boolean; isSuspended?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: Error | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from public.profiles
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
      // In dev fallback mode when Supabase is not configured
      const local = localStorage.getItem('beej_dost_farmer_profile');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // ignore
        }
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      if (data) {
        const mapped: UserProfile = {
          id: data.id,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          phone: data.phone,
          province: data.province,
          district: data.district,
          tehsil: data.tehsil,
          village: data.village,
          farmingType: data.farming_type,
          preferredLanguage: data.preferred_language || 'en',
          isVerifiedKeeper: Boolean(data.is_verified_keeper),
          isSuspended: Boolean(data.is_suspended),
          bio: data.bio,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Synchronize interface language if preferredLanguage is set
        if (mapped.preferredLanguage && mapped.preferredLanguage !== i18n.language) {
          void i18n.changeLanguage(mapped.preferredLanguage);
        }

        return mapped;
      }

      return null;
    } catch (err) {
      console.error('Failed to load user profile:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  }, [user?.id, fetchProfile]);

  // Session restoration and listener on mount
  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error restoring session:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user?.id) {
            const prof = await fetchProfile(initialSession.user.id);
            if (mounted) setProfile(prof);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user?.id) {
        const prof = await fetchProfile(newSession.user.id);
        if (mounted) setProfile(prof);
      } else {
        if (mounted) setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Registration flow
  const signUp = useCallback(async (data: SignUpData): Promise<{ error: Error | null; unconfirmed: boolean }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          getSupabaseConfigError() ||
            'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
        ),
        unconfirmed: false,
      };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            province: data.province,
            district: data.district,
            tehsil: data.tehsil || null,
            village: data.village || null,
            phone: data.phone || null,
            farming_type: data.farmingType || 'conventional',
            preferred_language: data.preferredLanguage || 'en',
          },
        },
      });

      if (error) {
        return { error, unconfirmed: false };
      }

      // If user exists and email is not confirmed, return unconfirmed true
      const isUnconfirmed = Boolean(authData.user && !authData.user.email_confirmed_at);
      return { error: null, unconfirmed: isUnconfirmed };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Registration failed'),
        unconfirmed: false,
      };
    }
  }, []);

  // Login flow with unconfirmed and suspension checks
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: Error | null; requiresEmailConfirmation?: boolean; isSuspended?: boolean }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          getSupabaseConfigError() || 'Supabase credentials are not configured in .env.'
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Detect unconfirmed email from Supabase error message
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { error: null, requiresEmailConfirmation: true };
        }
        return { error };
      }

      // Check if user is suspended
      if (data.user) {
        const prof = await fetchProfile(data.user.id);
        if (prof?.isSuspended) {
          // Immediately sign out to prevent session access
          await supabase.auth.signOut();
          return { error: null, isSuspended: true };
        }
        setProfile(prof);
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Authentication failed'),
      };
    }
  }, [fetchProfile]);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  // Request password reset email
  const resetPassword = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase credentials are not configured.'),
      };
    }

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      // Avoid leaking whether account exists: caller should display generic confirmation message
      return { error: error ? error : null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to send password reset request'),
      };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase credentials are not configured.'),
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to update password'),
      };
    }
  }, []);

  // Resend confirmation email
  const resendConfirmationEmail = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase credentials are not configured.') };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      return { error };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to resend confirmation email'),
      };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Authentication required') };
    }

    try {
      if (isSupabaseConfigured()) {
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.fullName !== undefined) payload.full_name = data.fullName;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.province !== undefined) payload.province = data.province;
        if (data.district !== undefined) payload.district = data.district;
        if (data.tehsil !== undefined) payload.tehsil = data.tehsil;
        if (data.village !== undefined) payload.village = data.village;
        if (data.farmingType !== undefined) payload.farming_type = data.farmingType;
        if (data.preferredLanguage !== undefined) payload.preferred_language = data.preferredLanguage;
        if (data.bio !== undefined) payload.bio = data.bio;

        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', user.id);

        if (error) return { error };
      }

      // Update local state
      await refreshProfile();
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to update profile'),
      };
    }
  }, [user, refreshProfile]);

  // Derived flags
  const isAuthenticated = Boolean(user && session);
  const isEmailConfirmed = Boolean(user?.email_confirmed_at);
  const isSuspended = Boolean(profile?.isSuspended);

  // Server-verified admin check (via JWT app_metadata only)
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const appMeta = user.app_metadata;
    return Boolean(appMeta && (appMeta.role === 'admin' || appMeta.is_admin === true));
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthenticated,
      isEmailConfirmed,
      isSuspended,
      isAdmin,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      resendConfirmationEmail,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      isAuthenticated,
      isEmailConfirmed,
      isSuspended,
      isAdmin,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      resendConfirmationEmail,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

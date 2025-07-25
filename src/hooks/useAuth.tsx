
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed - production ready (no console spam)

        if (!mounted) return;

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Get initial session with enhanced retry logic
    const getInitialSession = async () => {
      try {
        // Getting initial session - production ready
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Session error, attempting refresh - production ready
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Session refresh failed:', refreshError);
            // Clear any invalid session data
            if (mounted) {
              setSession(null);
              setUser(null);
            }
          } else if (refreshData.session && mounted) {
            // Session refreshed successfully - production ready
            setSession(refreshData.session);
            setUser(refreshData.session.user);
          }
        } else if (session && mounted) {
          // Valid session found - production ready
          setSession(session);
          setUser(session.user);
        } else {
          // No session found - production ready
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

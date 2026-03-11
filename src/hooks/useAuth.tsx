import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isVip: false,
  displayName: null,
  avatarUrl: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applySessionState = (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setIsAdmin(false);
        setIsVip(false);
        setDisplayName(null);
        setAvatarUrl(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void Promise.all([
        checkAdmin(nextSession.user.id),
        fetchProfile(nextSession.user.id),
        checkVip(nextSession.user.id),
      ]).finally(() => {
        if (isMounted) setLoading(false);
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySessionState(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySessionState(initialSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch error:', error.message);
      return;
    }

    setDisplayName(data?.display_name ?? null);
    setAvatarUrl(data?.avatar_url ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const checkAdmin = async (userId: string) => {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (error) {
      console.warn('Admin role check error:', error.message);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!data);
  };

  const checkVip = async (userId: string) => {
    const { data, error } = await supabase.rpc('is_vip', { _user_id: userId });
    if (error) {
      console.warn('VIP check error:', error.message);
      setIsVip(false);
      return;
    }
    setIsVip(!!data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsVip(false);
    setDisplayName(null);
    setAvatarUrl(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isVip, displayName, avatarUrl, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

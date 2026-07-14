import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import api from '../api/client';

const AuthContext = createContext(null);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb-access-token');
    const savedUser = localStorage.getItem('sb-user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchProfile();
    } else {
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          localStorage.setItem('sb-access-token', session.access_token);
          setUser(session.user);
          localStorage.setItem('sb-user', JSON.stringify(session.user));
          await fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('sb-access-token');
          localStorage.removeItem('sb-user');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const p = {
          id: session.user.id,
          email: session.user.email,
          full_name: meta.full_name || '',
          phone: meta.phone || '',
          role: meta.role || 'user'
        };
        setProfile(p);
        setLoading(false);
        return p;
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
    setLoading(false);
    return null;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    localStorage.setItem('sb-access-token', data.session.access_token);
    localStorage.setItem('sb-user', JSON.stringify(data.user));
    setUser(data.user);

    const profileData = await fetchProfile();
    return { ...data, user: data.user, profile: profileData };
  };

  const register = async (email, password, full_name, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone }
      }
    });

    if (error) throw error;

    if (data.session) {
      localStorage.setItem('sb-access-token', data.session.access_token);
      localStorage.setItem('sb-user', JSON.stringify(data.user));
      setUser(data.user);
      await fetchProfile();
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

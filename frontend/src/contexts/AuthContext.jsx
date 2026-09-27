import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout, isLoggedIn } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      getMe()
        .then(setUser)
        .catch(() => {
          apiLogout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    await apiLogin(email, password);
    const me = await getMe();
    setUser(me);
    return me;
  };

  const signup = async (name, email, password, college) => {
    await apiSignup(name, email, password, college);
    const me = await getMe();
    setUser(me);
    return me;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await getMe();
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

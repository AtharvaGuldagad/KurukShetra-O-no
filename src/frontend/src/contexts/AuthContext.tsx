import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  role: 'official' | 'citizen' | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('solace_auth_token'));
  const [role, setRole] = useState<'official' | 'citizen' | null>(
    localStorage.getItem('solace_auth_role') as 'official' | 'citizen' | null
  );

  const login = (newToken: string, newRole: string) => {
    localStorage.setItem('solace_auth_token', newToken);
    localStorage.setItem('solace_auth_role', newRole);
    setToken(newToken);
    setRole(newRole as 'official' | 'citizen');
  };

  const logout = () => {
    localStorage.removeItem('solace_auth_token');
    localStorage.removeItem('solace_auth_role');
    setToken(null);
    setRole(null);
  };

  // Sync token from localStorage across tabs (optional polish)
  useEffect(() => {
    const handleStorage = () => {
      const storedToken = localStorage.getItem('solace_auth_token');
      const storedRole = localStorage.getItem('solace_auth_role') as 'official' | 'citizen' | null;
      if (storedToken !== token) setToken(storedToken);
      if (storedRole !== role) setRole(storedRole);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [token, role]);

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
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

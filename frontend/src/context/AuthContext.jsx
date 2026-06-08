import { createContext, useState, useEffect, useContext } from 'react';
import { PlasmaAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Muat token & data user dari localStorage jika ada saat reload
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await PlasmaAPI.login(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error('Context login error:', error);
      throw error.response?.data?.error || 'Email atau password salah';
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; // Arahkan kembali ke portal publik
  };

  const isAdmin = user?.role === 'admin';
  const isValidator = ['validator_admin', 'validator_substantif', 'validator_final'].includes(user?.role);
  const isPeneliti = user?.role === 'peneliti';
  const isValidatorAdmin = user?.role === 'validator_admin';
  const isValidatorSubstantive = user?.role === 'validator_substantif';
  const isValidatorFinal = user?.role === 'validator_final';
 
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin,
        isValidator,
        isPeneliti,
        isValidatorAdmin,
        isValidatorSubstantive,
        isValidatorFinal,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

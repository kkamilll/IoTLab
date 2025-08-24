import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

// --- Helper: check if JWT is expired ---
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false; // if token has no exp, assume valid
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch (err) {
    return true; // if invalid token, treat as expired
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("pos-user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("pos-token");
    if (storedToken && isTokenExpired(storedToken)) {
      // clear expired token
      localStorage.removeItem("pos-token");
      localStorage.removeItem("pos-user");
      return null;
    }
    return storedToken || null;
  });

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("pos-user", JSON.stringify(userData));
    localStorage.setItem("pos-token", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pos-user");
    localStorage.removeItem("pos-token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
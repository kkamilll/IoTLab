import { createContext, useState, useContext, useEffect } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

// --- Helper: check if JWT is expired or malformed ---
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    return !payload.exp || payload.exp > now;
  } catch {
    return false; // malformed token
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("pos-user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("pos-token");
    if (!isTokenValid(storedToken)) {
      localStorage.removeItem("pos-token");
      localStorage.removeItem("pos-user");
      return null;
    }
    return storedToken;
  });

  const login = (userData, jwtToken) => {
    if (!isTokenValid(jwtToken)) return;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("pos-user", JSON.stringify(userData));
    localStorage.setItem("pos-token", jwtToken);
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = {
        ...(prev || {}),
        ...userData,
        id: userData?.id || userData?._id || prev?.id || prev?._id,
      };
      localStorage.setItem("pos-user", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (token) {
      apiClient
        .get("/users/profile")
        .then((res) => {
          if (res.data?.user) {
            updateUser(res.data.user);
          }
        })
        .catch(() => {
          // Token or connection errors handled by axios interceptors
        });
    }
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pos-user");
    localStorage.removeItem("pos-token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;

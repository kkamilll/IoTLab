import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RootRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard", { replace: true });
          break;
        case "lecturer":
          navigate("/admin-dashboard", { replace: true });
          break;
        default:
          navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default RootRedirect;

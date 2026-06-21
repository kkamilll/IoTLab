import axios from "axios";

const getBaseURL = () => {
  const ip = import.meta.env.VITE_API_IP || "";
  const port = import.meta.env.VITE_API_PORT || "";
  const postfix = import.meta.env.VITE_API_POSTFIX || "";
  return `${ip}${port}${postfix}`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pos-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem("language") || "pl";
    config.headers["Accept-Language"] = lang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatically handle 401 Unauthorized by clearing invalid/old tokens and redirecting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("pos-token");
      localStorage.removeItem("pos-user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

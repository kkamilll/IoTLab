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

// Automatically inject JWT token into requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pos-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

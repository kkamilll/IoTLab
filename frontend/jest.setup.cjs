require('@testing-library/jest-dom');

// Mock import.meta.env
globalThis.import = {
  meta: { env: { VITE_API_IP: "http://localhost", VITE_API_PORT: "3500" } }
};

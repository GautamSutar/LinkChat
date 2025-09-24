const config = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  WS_URL: "ws://localhost:8001" || "http://localhost:8001",
};

export default config;

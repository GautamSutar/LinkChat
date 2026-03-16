const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("localhost")) {
    return import.meta.env.VITE_API_URL;
  }
  return typeof window !== "undefined" ? `http://${window.location.hostname}:8000/api` : "http://localhost:8000/api";
};

const getWsUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL && !import.meta.env.VITE_SOCKET_URL.includes("localhost")) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return typeof window !== "undefined" ? `ws://${window.location.hostname}:8000` : "ws://localhost:8000";
};

const config = {
  API_URL: getApiUrl(),
  WS_URL: getWsUrl(),
};

export default config;

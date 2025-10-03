const config = {
  API_URL: import.meta.env.VITE_API_URL as string | undefined || "http://localhost:8000/api",
  WS_URL: import.meta.env.VITE_SOCKET_URL as string | undefined || "ws://localhost:8001/ws/chat/",
};

export default config;

import { useEffect, useState, useRef } from "react";
import config from "../../config";

// --- Helper component for individual chat messages (No changes needed here) ---
const MessageBubble = ({ fullMessage }) => {
  const isYou = fullMessage.startsWith("You:");
  const isStranger = fullMessage.startsWith("Stranger:");
  const isSystem = fullMessage.startsWith("---");

  let messageContent = fullMessage;
  if (isYou) {
    messageContent = fullMessage.substring(5);
  } else if (isStranger) {
    messageContent = fullMessage.substring(10);
  }

  const alignClass = isYou ? "self-end" : "self-start";
  const bubbleColor = isYou
    ? "bg-emerald-500 text-white"
    : "bg-white text-gray-800";
  const bubbleRounding = isYou
    ? "rounded-b-xl rounded-tl-xl"
    : "rounded-b-xl rounded-tr-xl";

  if (isSystem) {
    return (
      <div className="self-center my-2">
        <p className="text-sm text-gray-400 italic">{fullMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} max-w-xs md:max-w-md my-1`}>
      <div
        className={`px-4 py-2 rounded-lg shadow-md ${bubbleColor} ${bubbleRounding}`}
      >
        <p className="text-sm break-words">{messageContent}</p>
        <p className="text-xs opacity-75 text-right mt-1">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

// --- Main ChatRoom Component ---
export default function ChatRoom() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    const socketUrl = `${config.WS_URL}/ws/chat/random/`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => setIsConnected(true);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        setChat((prev) => [...prev, data.message]);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setChat((prev) => [
        ...prev,
        "--- You have been disconnected. Try refreshing the page. ---",
      ]);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setChat((prev) => [
        ...prev,
        "--- Welcome ---",
      ]);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const sendMessage = () => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      message.trim()
    ) {
      ws.current.send(JSON.stringify({ type: "message", message: message }));
      setMessage("");
    }
  };

  return (
    // FIX #1: Removed the `style` attribute with the broken image link.
    // It now correctly falls back to the `bg-gray-200` class.
    <div className="flex flex-col h-screen bg-gray-200">
      <header className="bg-emerald-600 shadow-md p-4 text-white flex items-center z-10">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Stranger</h1>
          <p
            className={`text-sm transition-opacity duration-300 ${
              isConnected ? "opacity-100" : "opacity-0"
            }`}
          >
            Online
          </p>
        </div>
      </header>

      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
      >
        <div className="flex flex-col space-y-2 max-w-2xl mx-auto">
          {chat.map((msg, i) => (
            <MessageBubble key={i} fullMessage={msg} />
          ))}
        </div>
      </main>

      <footer className="bg-gray-100 p-2 md:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-full p-2 shadow-md">
            <input
              value={message}
              // FIX #2: Changed e.value to e.target.value
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none"
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
                isConnected && message.trim()
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isConnected || !message.trim()}
            >
              <svg
                className="w-6 h-6 transform rotate-90"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

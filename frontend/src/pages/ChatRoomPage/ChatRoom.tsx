import { useEffect, useState, useRef } from "react";
import config from "../../config";
import TokenService from "../../service/token.service"; // Assuming you have this

// --- Helper component for individual chat messages ---
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

  // --- New Dark UI Styles ---
  const alignClass = isYou ? "self-end" : "self-start";
  const bubbleColor = isYou
    ? "bg-indigo-600 text-white" // A vibrant blue/purple for your messages
    : "bg-gray-700 text-gray-200"; // A sleek dark gray for theirs
  const bubbleRounding = isYou
    ? "rounded-b-xl rounded-tl-xl"
    : "rounded-b-xl rounded-tr-xl";

  if (isSystem) {
    return (
      <div className="self-center my-3">
        <p className="text-xs text-gray-400 italic px-3 py-1 bg-gray-800 rounded-full">{fullMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} max-w-sm md:max-w-md my-1`}>
      <div className={`px-4 py-2 rounded-lg shadow-md ${bubbleColor} ${bubbleRounding}`}>
        <p className="text-sm break-words">{messageContent}</p>
        <p className="text-xs text-gray-300/70 text-right mt-1">
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
const ChatRoom = ({ onLeave }) => { // Assuming you have an onLeave prop
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    const accessToken = TokenService.getAccessToken();
    if (!accessToken) {
      console.error("Authentication token not found.");
      if (onLeave) onLeave();
      return;
    }

    const socketUrl = `${config.WS_URL}random/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        setChat((prev) => [...prev, data.message]);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setChat((prev) => [
        ...prev,
        "--- You have been disconnected. ---",
      ]);
    };

    socket.onerror = (error) => console.error("WebSocket Error:", error);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && message.trim()) {
      ws.current.send(JSON.stringify({ type: "message", message: message }));
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen  text-white">
      {/* --- Header --- */}
      <header className="shadow-lg p-4 flex items-center justify-between z-10 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Stranger</h1>
            <div className="flex items-center">
              <div className={`w-2.5 h-2.5 rounded-full mr-2 transition-colors ${isConnected ? 'bg-green-400' : 'bg-red-500'}`}></div>
              <p className="text-sm text-gray-400">
                {isConnected ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm"
        >
          Leave
        </button>
      </header>

      {/* --- Main Chat Area --- */}
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col space-y-2 max-w-2xl mx-auto">
          {chat.map((msg, i) => (
            <MessageBubble key={i} fullMessage={msg} />
          ))}
        </div>
      </main>

      {/* --- Footer & Input --- */}
      <footer className="p-3 md:p-4 border-t border-gray-700">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center bg-gray-700 rounded-full p-2 shadow-inner">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") sendMessage(); }}
              className="flex-1 px-4 py-2 bg-transparent border-none text-gray-200 focus:outline-none placeholder-gray-500"
              placeholder={isConnected ? "Type a message..." : "Waiting to connect..."}
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 transform ${isConnected && message.trim()
                ? "bg-indigo-600 hover:bg-indigo-500 text-white scale-100"
                : "bg-gray-600 text-gray-400 scale-90 cursor-not-allowed"
                }`}
              disabled={!isConnected || !message.trim()}
            >
              <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;
import React, { useEffect, useState, useRef } from "react";
import config from "../../config";
import TokenService from "../../service/token.service";

// --- Props Definition ---
// This component now needs to communicate with its parent
type ChatRoomProps = {
  onStartVideo: (sessionId: string) => void;
  onLeave?: () => void;
};

// --- MessageBubble Component (Unchanged) ---
const MessageBubble: React.FC<{ fullMessage: string }> = ({ fullMessage }) => {
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
    ? "bg-indigo-600 text-white"
    : "bg-gray-700 text-gray-200";
  const bubbleRounding = isYou
    ? "rounded-b-xl rounded-tl-xl"
    : "rounded-b-xl rounded-tr-xl";

  if (isSystem) {
    return (
      <div className="self-center my-3">
        <p className="text-xs text-gray-400 italic px-3 py-1 bg-gray-800 rounded-full">
          {fullMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} max-w-sm md:max-w-md my-1`}>
      <div
        className={`px-4 py-2 rounded-lg shadow-md ${bubbleColor} ${bubbleRounding}`}
      >
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

// --- Main ChatRoom Component (Updated Logic) ---
const ChatRoom: React.FC<ChatRoomProps> = ({ onLeave, onStartVideo }) => {
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    const accessToken = TokenService.getAccessToken();
    if (!accessToken) {
      console.error("Authentication token not found.");
      if (onLeave) onLeave();
      return;
    }

    
    const socketUrl = `${config.WS_URL}/ws/chat/random/?token=${accessToken}`;
    const socket: WebSocket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      // UPDATED: Handle different message types
      if (data.type === "chat_message" || data.type === "system_message") {
        setChat((prev) => [...prev, data.message]);
      } else if (data.type === "video_initiated") {
        // Backend gave the signal, notify the parent component to switch views
        onStartVideo(data.session_id);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setChat((prev) => [...prev, "--- You have been disconnected. ---"]);
    };

    socket.onerror = (error) => console.error("WebSocket Error:", error);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // NEW: Function to send the "start_video" request to the backend
  const handleStartVideoClick = () => {
    ws.current?.send(JSON.stringify({ type: "start_video" }));
  };

  const sendMessage = () => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      message.trim()
    ) {
      // UPDATED: Ensure all messages send the correct 'type'
      ws.current.send(JSON.stringify({ type: "message", message: message }));
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg p-4 flex items-center justify-between z-10 border-b border-gray-700">
        {/* ... your existing header JSX ... */}
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
      <footer className="bg-gray-800 p-3 md:p-4 border-t border-gray-700">
        <div className="max-w-2xl mx-auto">
          {/* NEW: Video Call Button */}
          {isConnected && (
            <button
              onClick={handleStartVideoClick}
              className="w-full mb-3 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              Start Video Call
            </button>
          )}
          {/* ... your existing message input JSX ... */}
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;

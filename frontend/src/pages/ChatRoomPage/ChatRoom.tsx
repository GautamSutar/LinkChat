import { useEffect, useState, useRef } from "react";
import config from "../../config.ts";
import TokenService from "../../service/token.service";

type ChatRoomProps = {
  onLeave?: () => void;
  onStartVideo: (sessionId: string) => void;
};

type MessageBubbleProps = { fullMessage: string };
const MessageBubble: React.FC<MessageBubbleProps> = ({ fullMessage }) => {
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
      console.log("WebSocket message type:", data.type);
      switch (data.type) {
        case "chat_message":
        case "system_message":
          setChat((prev) => [...prev, data.message]);
          break;

        case "video_initiated":
          if (onStartVideo) {
            onStartVideo(data.session_id);
          }
          break;
        default:
          console.warn("Received unknown WebSocket message type:", data.type);
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

  const handleStartVideoClick = () => {
    ws.current?.send(JSON.stringify({ type: "start_video" }));
  };

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
    <div className="flex flex-col h-screen  text-white">
      <header className="shadow-lg p-4 flex items-center justify-between z-10 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
            <svg
              className="w-8 h-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Stranger</h1>
            <div className="flex items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full mr-2 transition-colors ${
                  isConnected ? "bg-green-400" : "bg-red-500"
                }`}
              ></div>
              <p className="text-sm text-gray-400">
                {isConnected ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <button
              onClick={handleStartVideoClick}
              className="px-4 cursor-pointer py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              Start Video
            </button>
          )}

          <button
            onClick={onLeave}
            className="px-4 py-2 cursor-pointer bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 12h6a1 1 0 010 2H9a1 1 0 010-2zm-3 0a1 1 0 000 2h.01a1 1 0 100-2H6z" />
            </svg>
            Leave
          </button>
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
      <footer className="p-3 md:p-4 border-t border-gray-700">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center bg-gray-700 rounded-full p-2 shadow-inner">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 px-4 py-2 bg-transparent border-none text-gray-200 focus:outline-none placeholder-gray-500"
              placeholder={
                isConnected ? "Type a message..." : "Waiting to connect..."
              }
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 transform ${
                isConnected && message.trim()
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white scale-100"
                  : "bg-gray-600 text-gray-400 scale-90 cursor-not-allowed"
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
};

export default ChatRoom;

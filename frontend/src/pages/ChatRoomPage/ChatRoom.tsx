import React, { useEffect, useState, useRef, useCallback } from "react";
import config from "../../config.ts";
import TokenService from "../../service/token.service";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ChatMessage = {
  message: string;
  sender: string;
  type: string;
};

type ChatRoomProps = {
  onLeave?: () => void;
  onStartVideo: (sessionId: string) => void;
  onStartVoice?: (sessionId: string) => void;
};

type IncomingCall = {
  kind: "video" | "voice";
  sessionId: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getMyName = (): string => {
  const raw = localStorage.getItem("user");
  if (!raw) return "You";
  try {
    const u = JSON.parse(raw);
    return u?.display_name || "You";
  } catch {
    return "You";
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: ChatMessage; myName: string }> = ({ msg, myName }) => {
  const isMe = msg.sender === myName;

  if (msg.type === "system_message") {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs px-4 py-1.5 rounded-full bg-white/5 text-gray-400 border border-white/10 backdrop-blur-sm">
          {msg.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md ${
          isMe
            ? "bg-indigo-600 text-white"
            : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
        }`}
      >
        {getInitials(isMe ? myName : msg.sender)}
      </div>
      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        <span className="text-[10px] text-gray-500 mb-1 px-1 font-medium">
          {isMe ? "You" : msg.sender}
        </span>
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${
            isMe
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm border border-white/5"
          }`}
        >
          {msg.message}
        </div>
        <span className="text-[10px] text-gray-600 mt-1 px-1">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Incoming Call Modal
// ─────────────────────────────────────────────
const IncomingCallModal: React.FC<{
  call: IncomingCall;
  onAccept: () => void;
  onDeny: () => void;
}> = ({ call, onAccept, onDeny }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full mx-4">
      <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
        {call.kind === "video" ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
          </svg>
        )}
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">
          Incoming {call.kind === "video" ? "Video" : "Voice"} Call
        </p>
        <p className="text-gray-400 text-sm mt-1">Stranger is calling you...</p>
      </div>
      <div className="flex gap-4 w-full">
        <button
          onClick={onDeny}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition cursor-pointer"
        >
          Accept
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Outgoing Call Overlay
// ─────────────────────────────────────────────
const OutgoingCallOverlay: React.FC<{ kind: string; onCancel: () => void }> = ({
  kind,
  onCancel,
}) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full mx-4">
      <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-400 animate-ping absolute" />
        <svg className="w-8 h-8 text-white relative" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">
          Calling... ({kind === "video" ? "Video" : "Voice"})
        </p>
        <p className="text-gray-400 text-sm mt-1">Waiting for the other person to pick up</p>
      </div>
      <button
        onClick={onCancel}
        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition cursor-pointer"
      >
        Cancel
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// ChatRoom Component
// ─────────────────────────────────────────────
const ChatRoom: React.FC<ChatRoomProps> = ({ onLeave, onStartVideo, onStartVoice }) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerGender, setPartnerGender] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{ kind: string; sessionId: string } | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ringtone = useRef<HTMLAudioElement | null>(null);
  const outgoingRingtone = useRef<HTMLAudioElement | null>(null);
  const myName = getMyName();

  useEffect(() => {
    ringtone.current = new Audio("/sounds/slack_ringtone.mp3");
    ringtone.current.loop = true;
    outgoingRingtone.current = new Audio("/sounds/slack_ringtone.mp3");
    outgoingRingtone.current.loop = true;
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const stopAllRingtones = useCallback(() => {
    try {
      ringtone.current?.pause();
      if (ringtone.current) ringtone.current.currentTime = 0;
      outgoingRingtone.current?.pause();
      if (outgoingRingtone.current) outgoingRingtone.current.currentTime = 0;
    } catch {}
  }, []);

  // WebSocket connection
  useEffect(() => {
    const accessToken = TokenService.getAccessToken();
    if (!accessToken) {
      if (onLeave) onLeave();
      return;
    }

    const socketUrl = `${config.WS_URL}/ws/chat/random/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => {
      setIsConnected(false);
      setPartnerJoined(false);
      setPartnerName(null);
      setPartnerGender(null);
      stopAllRingtones();
      setChat((prev) => [
        ...prev,
        { message: "You have been disconnected.", sender: "System", type: "system_message" },
      ]);
    };

    socket.onerror = (e) => console.error("WebSocket Error:", e);

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("DEBUG: WS Received:", data.type, data);

      if (data.type === "partner_joined") {
        setPartnerJoined(true);
        setPartnerName(data.partner_name || "Stranger");
        setPartnerGender(data.partner_gender || "O");
        setChat((prev) => [
          ...prev,
          { message: data.message, sender: "System", type: "system_message" },
        ]);
      } else if (data.type === "partner_left") {
        setPartnerJoined(false);
        setPartnerName(null);
        setPartnerGender(null);
        stopAllRingtones();
        setIncomingCall(null);
        setOutgoingCall(null);
        setChat((prev) => [
          ...prev,
          { message: data.message, sender: "System", type: "system_message" },
        ]);
      } else if (data.type === "chat_message") {
        if (data.sender === myName && myName !== "Anonymous") return;
        const msgText =
          typeof data.message === "object" ? JSON.stringify(data.message) : data.message;
        setChat((prev) => [
          ...prev,
          { message: msgText, sender: data.sender || "Stranger", type: "chat_message" },
        ]);
      } else if (data.type === "system_message") {
        const msgText =
          typeof data.message === "object" ? JSON.stringify(data.message) : data.message;
        setChat((prev) => [
          ...prev,
          { message: msgText, sender: "System", type: "system_message" },
        ]);
      } else if (data.type === "call_incoming") {
        // Receiver: show incoming call modal + play ringtone
        setIncomingCall({ kind: data.call_kind, sessionId: data.session_id });
        ringtone.current?.play().catch(() => {});
      } else if (data.type === "call_outgoing") {
        // Caller: show outgoing overlay + play outgoing ringtone
        setOutgoingCall({ kind: data.call_kind, sessionId: data.session_id });
        outgoingRingtone.current?.play().catch(() => {});
      } else if (data.type === "call_started") {
        // Both: stop ringtones and navigate to the call
        stopAllRingtones();
        setIncomingCall(null);
        setOutgoingCall(null);
        if (data.call_kind === "video") {
          if (onStartVideo) onStartVideo(data.session_id);
        } else {
          if (onStartVoice) onStartVoice(data.session_id);
        }
      } else if (data.type === "call_rejected") {
        // Caller: the receiver rejected
        stopAllRingtones();
        setOutgoingCall(null);
        setChat((prev) => [
          ...prev,
          { message: "--- Call was declined ---", sender: "System", type: "system_message" },
        ]);
      }
    };

    return () => {
      socket.onmessage = null;
      stopAllRingtones();
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [onStartVideo, onStartVoice, onLeave, myName, stopAllRingtones]);

  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN && message.trim()) {
      ws.current.send(JSON.stringify({ type: "message", message }));
      setChat((prev) => [
        ...prev,
        { message, sender: myName, type: "chat_message" },
      ]);
      setMessage("");
      inputRef.current?.focus();
    }
  };

  const handleStartVideo = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "start_video" }));
    }
  };

  const handleStartVoice = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "start_voice" }));
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    ws.current?.send(
      JSON.stringify({
        type: "call_accepted",
        call_kind: incomingCall.kind,
        session_id: incomingCall.sessionId,
      })
    );
    stopAllRingtones();
  };

  const handleDenyCall = () => {
    if (!incomingCall) return;
    ws.current?.send(JSON.stringify({ type: "call_denied" }));
    stopAllRingtones();
    setIncomingCall(null);
  };

  const handleCancelOutgoing = () => {
    ws.current?.send(JSON.stringify({ type: "call_denied" }));
    stopAllRingtones();
    setOutgoingCall(null);
  };

  // ─── Header Status Pill ─────────────────────
  const StatusPill = () => (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          partnerJoined
            ? "bg-emerald-400 animate-pulse"
            : isConnected
            ? "bg-yellow-400 animate-pulse"
            : "bg-gray-600"
        }`}
      />
      <span className="text-xs text-gray-400 font-medium">
        {partnerJoined ? "Connected" : isConnected ? "Waiting..." : "Disconnected"}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-[#0d0d0d] relative">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDeny={handleDenyCall}
        />
      )}

      {/* Outgoing Call Overlay */}
      {outgoingCall && (
        <OutgoingCallOverlay kind={outgoingCall.kind} onCancel={handleCancelOutgoing} />
      )}

      {/* ─── Header ─────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/8 bg-[#111] backdrop-blur supports-[backdrop-filter]:bg-[#111]/80 z-10 shrink-0">
        {/* Left: Avatar + Name + Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                partnerJoined
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {partnerJoined && partnerName ? getInitials(partnerName) : "?"}
            </div>
            {partnerJoined && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#111] rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-100 leading-none">
                {partnerJoined && partnerName ? partnerName : "Stranger"}
              </p>
              {partnerJoined && partnerGender && partnerGender !== "O" && (
                <span className="text-xs text-gray-400 font-medium">
                  ({partnerGender === "M" ? "Male" : "Female"})
                </span>
              )}
            </div>
            <div className="mt-0.5">
              <StatusPill />
            </div>
          </div>
        </div>

        {/* Right: Call Actions */}
        <div className="flex items-center gap-2">
          {partnerJoined && (
            <>
              {/* Voice Call */}
              <button
                onClick={handleStartVoice}
                title="Start voice call"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-emerald-700 text-gray-300 hover:text-white transition-all duration-200 hover:scale-110 shadow cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                </svg>
              </button>

              {/* Video Call */}
              <button
                onClick={handleStartVideo}
                title="Start video call"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-indigo-700 text-gray-300 hover:text-white transition-all duration-200 hover:scale-110 shadow cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </button>
            </>
          )}

          {/* Leave */}
          <button
            onClick={onLeave}
            title="Leave chat"
            className="px-3 py-1.5 cursor-pointer rounded-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold transition-all duration-200 border border-red-600/30 hover:border-red-600"
          >
            Leave
          </button>
        </div>
      </header>

      {/* ─── Chat Body ───────────────────────────── */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 relative scroll-smooth"
      >
        {/* Connecting Overlay */}
        {!partnerJoined && isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 animate-ping absolute inset-0" />
                <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center relative">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Finding a stranger…</p>
                <p className="text-gray-500 text-sm mt-1">You'll be connected with a random person shortly.</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {chat.length === 0 && !isConnected && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Not connected yet.
          </div>
        )}
        {chat.map((msg, i) => (
          <MessageBubble key={i} msg={msg} myName={myName} />
        ))}
      </main>

      {/* ─── Footer Input ────────────────────────── */}
      <footer className="shrink-0 px-4 sm:px-6 py-3 border-t border-white/8 bg-[#111]">
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-2 border border-white/8 shadow-inner">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-1 bg-transparent border-none text-gray-100 placeholder-gray-600 focus:outline-none text-sm"
            placeholder={
              !isConnected
                ? "Not connected..."
                : !partnerJoined
                ? "Waiting for someone to join..."
                : `Message ${partnerName ?? "Stranger"}...`
            }
            disabled={!isConnected || !partnerJoined}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !partnerJoined || !message.trim()}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${
              isConnected && partnerJoined && message.trim()
                ? "bg-indigo-600 hover:bg-indigo-500 text-white scale-100 shadow-md"
                : "bg-gray-800 text-gray-600 cursor-not-allowed scale-95"
            }`}
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-700 mt-2">
          Press <kbd className="font-mono bg-gray-800 px-1 rounded">Enter</kbd> to send
        </p>
      </footer>
    </div>
  );
};

export default ChatRoom;

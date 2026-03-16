import React, { useState, useCallback } from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";
import { useAuth } from "../../hooks/useAuth";
type Mode = "chat" | "video" | "voice";
const HomePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const handleStartVideo = useCallback((newSessionId: string) => {
    console.log("HomePage received session ID:", newSessionId);
    setSessionId(newSessionId);
    setMode("video");
  }, []);

  const handleStartVoice = useCallback((newSessionId: string) => {
    console.log("HomePage received voice session ID:", newSessionId);
    setSessionId(newSessionId);
    setMode("voice");
  }, []);

  const handleLeave = useCallback(() => {
    setSessionId(null);
    setMode("chat");
  }, []);

  if (isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen text-gray-300 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <header className="text-center mb-6 px-2">
          <h1
            className="font-bold text-white leading-tight break-words max-w-[90vw] mx-auto"
            style={{ fontSize: "clamp(2.5rem, 10vw, 6rem)" }}
          >
            <span className="text-transparent font-extrabold bg-clip-text bg-gradient-to-r from-black to-white">
              Welco
            </span>
            <span className="text-transparent font-extrabold bg-clip-text bg-gradient-to-r from-white to-white">
              me To{" "}
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Link
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
              Chat
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-400 px-2">
            Connect with new people through text or video. Your next
            conversation awaits.
          </p>
        </header>
        <main className="flex-1 flex flex-col bg-black rounded-2xl shadow-xl border border-gray-700 overflow-hidden max-w-5xl w-full mx-auto">
          {mode === "chat" ? (
            <ChatRoom onStartVideo={handleStartVideo} onStartVoice={handleStartVoice} onLeave={handleLeave} />
          ) : mode === "video" ? (
            <VideoCall sessionId={sessionId!} isVideo={true} onLeaveVideo={handleLeave} />
          ) : (
            <VideoCall sessionId={sessionId!} isVideo={false} onLeaveVideo={handleLeave} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-gray-300 p-3 sm:p-6 lg:p-8 bg-transparent overflow-x-hidden">
      <header className="text-center mb-8 px-2">
        <h1
          className="font-bold text-white leading-tight break-words max-w-[90vw] mx-auto"
          style={{ fontSize: "clamp(2.5rem, 10vw, 6rem)" }}
        >
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black to-white">
            Welco
          </span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white">
            me To{" "}
          </span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
            LinkChat
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-400">
          Please log in or sign up to connect with people from around the world.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center"></div>
      </header>
    </div>
  );
};

export default HomePage;

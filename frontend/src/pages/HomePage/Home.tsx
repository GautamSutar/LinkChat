import React, { useState, useCallback } from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";
import { useAuth } from "../../hooks/useAuth";
type Mode = "chat" | "video";
const HomePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth(); // Assuming you have a logout button somewhere

  const handleStartVideo = useCallback((newSessionId: string) => {
    console.log("HomePage received session ID:", newSessionId);
    setSessionId(newSessionId);
    setMode("video");
  }, []);

  const handleLeave = useCallback(() => {
    setSessionId(null);
    setMode("chat");
  }, []);
  if (isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen text-gray-300 p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-6">
          <h1 className="text-9xl md:text-9xl font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-white">
              Welco
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white">
              me To{" "}
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Link
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
              Chat
            </span>
          </h1>
          <p className="mt-2 text-md text-gray-400">
            Connect with new people through text or video. Your next
            conversation awaits.
          </p>
        </header>
        <main className="flex-1 flex flex-col bg-black rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          {mode === "chat" ? (
            <ChatRoom onStartVideo={handleStartVideo} onLeave={handleLeave} />
          ) : (
            <VideoCall sessionId={sessionId!} onLeaveVideo={handleLeave} />
          )}
        </main>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen text-gray-300 p-4 sm:p-6 lg:p-8 bg-transparent">
      <header className="text-center mb-8">
        <h1 className="text-9xl font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-white">
            Welco
          </span>
          <span className="">me To </span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
            LinkChat
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Please log in or sign up to connect with people from around the world.
        </p>
        <div className="mt-8 flex gap-4 justify-center">{/* Your FireButton components for login/signup would go here */}
        </div>
      </header>
    </div>
  );
};

export default HomePage;
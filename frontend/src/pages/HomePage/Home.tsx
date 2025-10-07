import React, { useState } from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";
import { useAuth } from "../../hooks/useAuth";
import FireButton from "../../components/ui/FireButton";
import { Link } from "react-router-dom";
type Mode = "chat" | "video";
const HomePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isAuthenticated = useAuth();

  const handleStartVideo = (newSessionId) => {
    setSessionId(newSessionId);
    setMode("video");
  };
  const handleLeaveVideo = () => {
    setSessionId(null);
    setMode("chat");
  };
  if (isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen text-gray-300 p-4 sm:p-6 lg:p-8 bg-transparent">
        <header className="text-center mb-8">
          <h1 className="text-9xl  font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-white">
              Welco
            </span>
            <span className="">me To </span>
            {/* This span replicates the gradient from your logo's text */}
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
              LinkChat{""}
            </span>
            {/* <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 ">
            at
          </span> */}
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Please log in or sign up to connect with people from around the
            world.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <FireButton
              to="/login"
              text="Log In"
              bgColor="bg-indigo-600"
              hoverColor="bg-indigo-500"
            />
            <FireButton
              to="/signup"
              text="Sign Up"
              bgColor="bg-gray-600"
              hoverColor="bg-gray-500"
            />
          </div>
          {/* cyan-400   green-400 */}
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
            Connect with new people through text or video. Your next
            conversation awaits.
          </p>
        </header>

        {/* Main content area with a flex layout for side-by-side components */}
        <main className="flex flex-1 flex-col lg:flex-row gap-6">
          {/* VideoCall Component Container */}
          <section className="flex-1 bg-black rounded-2xl shadow-xl border border-gray-700 p-4 flex flex-col">
            <VideoCall />
          </section>

          {/* ChatRoom Component Container */}
          <section className="flex-1 bg-black rounded-2xl shadow-xl border border-gray-700 p-4 flex flex-col">
            <ChatRoom />
          </section>
        </main>
      </div>
    );
  }
  return (
    <div className="h-screen bg-gray-900">
      {mode === "chat" ? (

        <ChatRoom onStartVideo={handleStartVideo} />
      ) : (
        <VideoCall sessionId={sessionId} onLeaveVideo={handleLeaveVideo} />
      )}
    </div>
  );
};

export default HomePage;

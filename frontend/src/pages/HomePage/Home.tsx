import React, { useState } from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";

// Define the possible states for our component
type Mode = "selection" | "chat" | "video";

const HomePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("selection");

  const handleStartChat = () => setMode("chat");
  const handleStartVideo = () => setMode("video");
  const handleLeave = () => setMode("selection");

  // Render the Selection Screen
  if (mode === "selection") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg w-full">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to Funtalky 🚀
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Connect with new people through text or video. Choose how you want
            to start.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {/* Text Chat Button */}
            <button
              onClick={handleStartChat}
              className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-600 transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Text Chat
            </button>

            {/* Video Call Button */}
            <button
              onClick={handleStartVideo}
              className="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Video Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the ChatRoom component if mode is 'chat'
  if (mode === "chat") {
    return <ChatRoom onLeave={handleLeave} />;
  }

  // Render the VideoCall component if mode is 'video'
  if (mode === "video") {
    return <VideoCall onLeave={handleLeave} />;
  }

  return null; // Should not be reached
};

export default HomePage;

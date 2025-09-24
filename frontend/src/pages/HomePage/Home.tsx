import React from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome to Funtalky 🚀
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Connect with new people through text or video. Start your conversation
          below.
        </p>
      </header>

      {/* Main content: VideoCall left, ChatRoom right */}
      <div className="flex flex-1 gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-2xl p-4">
          <VideoCall />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-2xl p-4">
          <ChatRoom />
        </div>
      </div>
    </div>
  );
};

export default HomePage;

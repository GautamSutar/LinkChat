import React from "react";
import ChatRoom from "../ChatRoomPage/ChatRoom";
import VideoCall from "../VideoCallPage/VideoCall";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen text-gray-300 p-4 sm:p-6 lg:p-8 bg-transparent">
      <header className="text-center mb-8">
        <h1 className="text-9xl  font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-white">
            Welco
          </span>
          <span className="">
            me To{" "}
          </span>
          {/* This span replicates the gradient from your logo's text */}
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-black">
            LinkChat{""}
          </span>
          {/* <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 ">
            at
          </span> */}
        </h1>

        {/* cyan-400   green-400 */}
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
          Connect with new people through text or video. Your next conversation
          awaits.
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
};

export default HomePage;

import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage/Home";
import ChatRoom from "../pages/ChatRoomPage/ChatRoom";
import VideoCall from "../pages/VideoCallPage/VideoCall";
// import { Sign } from "crypto";
import SignupPage from "../pages/AuthPage/SignupPage";
import LoginPage from "../pages/AuthPage/LoginPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/chat" element={<ChatRoom />} />
      <Route path="/video" element={<VideoCall />} />
    </Routes>
  );
}

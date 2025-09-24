import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage/Home";
import Login from "../pages/AuthPage/Login";
import Signup from "../pages/AuthPage/Signup";
import ChatRoom from "../pages/ChatRoomPage/ChatRoom";
import VideoCall from "../pages/VideoCallPage/VideoCall";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<ChatRoom />} />
      <Route path="/video" element={<VideoCall />} />
    </Routes>
  );
}

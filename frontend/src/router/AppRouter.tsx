import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage/Home";
import ChatRoom from "../pages/ChatRoomPage/ChatRoom";
import VideoCall from "../pages/VideoCallPage/VideoCall";
import SignupPage from "../pages/AuthPage/SignupPage";
import LoginPage from "../pages/AuthPage/LoginPage";
import GamePage from "../pages/GamePage/GamePage";
import GameLobby from "../pages/GamePage/GameLobby";
import Connect4Page from "../pages/GamePage/Connect4Page";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/game" element={<GameLobby />} />
      <Route path="/game/tictactoe" element={<GamePage />} />
      <Route path="/game/connect4" element={<Connect4Page />} />
      <Route path="/chat" element={<ChatRoom onStartVideo={() => {}} />} />
      <Route
        path="/video"
        element={<VideoCall sessionId="" onLeaveVideo={() => {}} />}
      />
    </Routes>
  );
}


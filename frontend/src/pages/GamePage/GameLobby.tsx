import React from "react";
import { useNavigate } from "react-router-dom";

const games = [
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    description: "Classic 3×3 strategy. Get 3 in a row to win!",
    icon: "⚔️",
    gradient: "from-indigo-500 to-purple-600",
    shadowColor: "rgba(99,102,241,0.3)",
    players: "2 Players",
    route: "/game/tictactoe",
  },
  {
    id: "connect4",
    title: "Connect 4",
    description: "Drop pieces on a 7×6 grid. Connect 4 to win!",
    icon: "🔴",
    gradient: "from-rose-500 to-orange-500",
    shadowColor: "rgba(244,63,94,0.3)",
    players: "2 Players",
    route: "/game/connect4",
  },
];

const GameLobby: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black relative overflow-hidden pt-16">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center mb-12 animate-fade-in-up">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 tracking-tight">
          Game Arcade
        </h1>
        <p className="text-gray-400 mt-3 text-lg">Challenge a random stranger to a game</p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-6 justify-center px-4 animate-fade-in-up">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => navigate(game.route)}
            className="group w-72 p-6 text-left bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:border-white/20 flex flex-col gap-4"
            style={{ boxShadow: `0 0 0 0 ${game.shadowColor}` }}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${game.gradient} shadow-lg`}
            >
              {game.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                {game.title}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{game.description}</p>
            </div>
            <div className="mt-auto flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/10 text-gray-300">
                👥 {game.players}
              </span>
              <span className="ml-auto text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                Play →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameLobby;

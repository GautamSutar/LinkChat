import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TokenService from "../../service/token.service";
import config from "../../config";

type Piece = "R" | "Y" | null;
type Board = Piece[][];

type GameState = {
  mode: "c4";
  board: Board;
  current_turn: "R" | "Y";
  player_r_channel: string;
  player_y_channel: string;
  player_r_name: string;
  player_y_name: string;
  winner: "R" | "Y" | null;
  is_draw: boolean;
};

const COLS = 7;

const cellBg = (cell: Piece, isMyTurn: boolean, colFull: boolean) => {
  if (cell === "R") return "bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.8)] border-rose-400";
  if (cell === "Y") return "bg-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.8)] border-yellow-300";
  if (!cell && isMyTurn && !colFull)
    return "bg-white/5 border-white/10 hover:bg-rose-400/20 hover:border-rose-400/50 hover:shadow-[0_0_16px_rgba(244,63,94,0.3)] cursor-pointer";
  return "bg-white/5 border-white/5 cursor-not-allowed";
};

const Connect4Page: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySymbol, setMySymbol] = useState<"R" | "Y" | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, []);

  const connectWS = () => {
    const token = TokenService.getAccessToken();
    if (!token) { alert("Please log in first"); navigate("/login"); return; }
    setIsSearching(true);
    setGameActive(false);
    setGameState(null);

    // Use c4_random prefix so backend can distinguish it from ttt
    const socket = new WebSocket(`${config.WS_URL}/ws/game/c4_random/?token=${token}`);
    ws.current = socket;

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "game_start") {
        setIsSearching(false);
        setGameActive(true);
        setMySymbol(data.my_symbol);
        setPartnerName(data.partner_name);
        setGameState(data.state);
      } else if (data.type === "game_update") {
        setGameState(data.state);
      } else if (data.type === "partner_left") {
        setGameActive(false);
        alert(data.message);
      }
    };
    socket.onclose = () => { setIsSearching(false); setGameActive(false); };
  };

  const dropPiece = (col: number) => {
    if (!gameActive || !gameState || !mySymbol) return;
    if (gameState.current_turn !== mySymbol) return;
    if (gameState.winner || gameState.is_draw) return;
    ws.current?.send(JSON.stringify({ action: "make_move", col }));
  };

  const playAgain = () => {
    ws.current?.close();
    setTimeout(connectWS, 100);
  };

  const isColFull = (col: number) => gameState?.board[0][col] !== null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black relative overflow-hidden pt-16 pb-8">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl p-6 m-4 space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Title */}
        <div className="text-center">
          <button onClick={() => navigate("/game")} className="text-gray-500 hover:text-gray-300 text-sm mb-2 transition-colors">← Back to Lobby</button>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-yellow-400 tracking-tight">
            Connect 4
          </h1>
        </div>

        {/* Searching */}
        {isSearching && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 animate-ping" />
              <div className="w-12 h-12 rounded-full bg-rose-600/20 flex items-center justify-center relative">
                <span className="text-rose-400 text-xl">🔴</span>
              </div>
            </div>
            <p className="text-rose-300 font-medium animate-pulse">Searching for opponent...</p>
          </div>
        )}

        {/* Turn indicator */}
        {gameActive && gameState && (
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
            <div className={`flex flex-col items-center gap-1 ${mySymbol === "R" ? "scale-110" : "opacity-50"}`}>
              <div className="w-8 h-8 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
              <span className="text-xs text-gray-300 uppercase tracking-wide">{mySymbol === "R" ? "You" : partnerName}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Turn</span>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${gameState.current_turn === mySymbol ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-gray-800 text-gray-400"}`}>
                {gameState.current_turn === mySymbol ? "YOUR TURN" : "WAITING"}
              </div>
            </div>
            <div className={`flex flex-col items-center gap-1 ${mySymbol === "Y" ? "scale-110" : "opacity-50"}`}>
              <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)]" />
              <span className="text-xs text-gray-300 uppercase tracking-wide">{mySymbol === "Y" ? "You" : partnerName}</span>
            </div>
          </div>
        )}

        {/* Board */}
        {gameActive && gameState && (
          <div className="relative">
            {/* End overlay */}
            {(gameState.winner || gameState.is_draw) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                <h2 className={`text-4xl font-black mb-3 ${gameState.winner === mySymbol ? "text-emerald-400" : gameState.is_draw ? "text-yellow-400" : "text-rose-400"}`}>
                  {gameState.winner === mySymbol ? "YOU WIN! 🎉" : gameState.is_draw ? "DRAW! 🤝" : "YOU LOSE 😔"}
                </h2>
                <div className="flex gap-3">
                  <button onClick={playAgain} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 border border-white/20">
                    Play Again
                  </button>
                  <button onClick={() => navigate("/game")} className="px-6 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-full font-bold transition-all hover:scale-105 border border-indigo-500/30">
                    Back to Lobby
                  </button>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="bg-black/60 rounded-2xl p-4 border border-white/5">
              {/* Column drop buttons */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {Array.from({ length: COLS }, (_, col) => (
                  <button
                    key={col}
                    onClick={() => dropPiece(col)}
                    disabled={!!gameState.winner || gameState.is_draw || gameState.current_turn !== mySymbol || !!isColFull(col)}
                    className="flex items-center justify-center h-6 text-rose-400 disabled:opacity-20 transition-opacity hover:opacity-80 text-lg"
                    title={`Drop in column ${col + 1}`}
                  >
                    ▼
                  </button>
                ))}
              </div>

              {/* Cells */}
              {gameState.board.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-7 gap-2 mb-2">
                  {row.map((cell, colIdx) => (
                    <div
                      key={colIdx}
                      className={`h-11 w-full rounded-full border transition-all duration-300 ${cellBg(cell, gameState.current_turn === mySymbol && !gameState.winner, !!isColFull(colIdx))}`}
                      onClick={() => !cell && dropPiece(colIdx)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect4Page;

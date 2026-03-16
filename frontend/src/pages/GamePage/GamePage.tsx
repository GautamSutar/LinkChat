import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TokenService from "../../service/token.service";
import config from "../../config";

// --- Types ---
type PlayerSymbol = "X" | "O" | null;

type GameState = {
  board: PlayerSymbol[];
  current_turn: PlayerSymbol;
  player_x_channel: string;
  player_o_channel: string;
  player_x_name: string;
  player_o_name: string;
  winner: PlayerSymbol;
  is_draw: boolean;
};

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySymbol, setMySymbol] = useState<PlayerSymbol>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const accessToken = TokenService.getAccessToken();
    if (!accessToken) {
      alert("Please login first to play the game");
      return;
    }

    setIsSearching(true);
    setGameActive(false);
    setGameState(null);
    setPartnerName(null);

    const socketUrl = `${config.WS_URL}/ws/game/random/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);
    
    socket.onclose = () => {
      setIsConnected(false);
      setIsSearching(false);
      setGameActive(false);
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("Game WS Rx:", data);

      if (data.type === "system_message") {
        // Just searching
      } else if (data.type === "game_start") {
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
  };

  const handleCellClick = (index: number) => {
    if (!gameActive || !gameState || !mySymbol) return;
    
    // Not my turn
    if (gameState.current_turn !== mySymbol) return;
    
    // Cell occupied
    if (gameState.board[index] !== null) return;
    
    // Game over
    if (gameState.winner || gameState.is_draw) return;

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        action: "make_move",
        index: index
      }));
    }
  };

  const playAgain = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    setTimeout(() => {
      connectWebSocket();
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black relative overflow-hidden pt-16">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg p-8 m-4 space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <button onClick={() => navigate("/game")} className="text-gray-500 hover:text-gray-300 text-sm mb-1 transition-colors block mx-auto">
            ← Back to Lobby
          </button>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
            Tic-Tac-Toe
          </h1>
          
          {!isConnected && !isSearching && (
             <p className="text-gray-400">Connecting to server...</p>
          )}

          {isSearching && (
            <div className="flex flex-col items-center gap-3 mt-4">
               <div className="relative">
                 <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 animate-ping absolute inset-0" />
                 <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center relative">
                   <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
               </div>
               <p className="text-indigo-300 font-medium animate-pulse">Searching for match...</p>
            </div>
          )}

          {gameActive && gameState && (
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 mt-4">
               <div className={`flex flex-col items-center ${mySymbol === 'X' ? 'scale-110 text-emerald-400' : 'text-gray-500'}`}>
                 <span className="text-2xl font-bold">X</span>
                 <span className="text-xs uppercase tracking-wider">{mySymbol === 'X' ? 'You' : partnerName}</span>
               </div>
               
               <div className="flex flex-col items-center">
                 <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Turn</span>
                 <div className={`px-3 py-1 rounded-full text-sm font-bold ${gameState.current_turn === mySymbol ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-gray-800 text-gray-400'}`}>
                   {gameState.current_turn === mySymbol ? 'YOUR TURN' : 'WAITING'}
                 </div>
               </div>

               <div className={`flex flex-col items-center ${mySymbol === 'O' ? 'scale-110 text-rose-400' : 'text-gray-500'}`}>
                 <span className="text-2xl font-bold">O</span>
                 <span className="text-xs uppercase tracking-wider">{mySymbol === 'O' ? 'You' : partnerName}</span>
               </div>
            </div>
          )}
        </div>

        {/* Game Board */}
        {gameActive && gameState && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-black/50 rounded-2xl border border-white/5 relative">
            
            {/* End Game Overlay */}
            {(gameState.winner || gameState.is_draw) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl animate-fade-in-up">
                 <h2 className={`text-4xl font-black mb-2 ${gameState.winner === mySymbol ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : gameState.is_draw ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]'}`}>
                   {gameState.winner === mySymbol ? 'YOU WIN!' : gameState.is_draw ? 'DRAW' : 'YOU LOSE'}
                 </h2>
                 <button 
                   onClick={playAgain}
                   className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 border border-white/20"
                 >
                   Play Again
                 </button>
              </div>
            )}

            {gameState.board.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!!gameState.winner || !!gameState.is_draw || cell !== null || gameState.current_turn !== mySymbol}
                className={`h-24 sm:h-28 flex items-center justify-center text-5xl sm:text-6xl font-black rounded-xl transition-all duration-300
                  ${cell === null && gameState.current_turn === mySymbol && !gameState.winner 
                    ? 'hover:bg-indigo-500/20 cursor-pointer bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                    : cell === null 
                      ? 'bg-white/5 border border-white/5 cursor-not-allowed'
                      : cell === 'X'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]'
                  }
                `}
              >
                {cell}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default GamePage;

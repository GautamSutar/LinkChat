import React from "react";
import { NavLink, Link } from "react-router-dom"; // Use NavLink for navigation items

const Navbar: React.FC = () => {
  return (
    <nav className="fixed w-full top-0 z-50 bg-[#0a0a0a]/70 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo and Brand (using Link for non-nav items) */}
          <Link to="/">
            <img src="/LinkChatLogo.jpeg" alt="LinkChat Logo" className="h-10 w-auto"  />
          </Link>

          {/* Center: Navigation Links using NavLink */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink
                to="/"
                // This function dynamically applies classes
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/game"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isActive
                    ? "bg-indigo-600/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-500/50"
                    : "text-gray-400 hover:bg-indigo-600/10 hover:text-indigo-300 border border-transparent hover:border-indigo-500/30"
                  }`
                }
              >
                🎮 Play Game
              </NavLink>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

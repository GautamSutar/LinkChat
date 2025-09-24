import React from "react";
import { NavLink, Link } from "react-router-dom"; // Use NavLink for navigation items

const Navbar: React.FC = () => {
  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo and Brand (using Link for non-nav items) */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="rocket">
              🚀
            </span>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Funtalky
            </h1>
          </Link>

          {/* Center: Navigation Links using NavLink */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink
                to="/"
                // This function dynamically applies classes
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-700 text-white" // Style for the active link
                      : "text-gray-300 hover:bg-gray-700 hover:text-white" // Style for inactive links
                  }`
                }
              >
                Home
              </NavLink>
              {/* Example of another NavLink */}
              <NavLink
                to="/features"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                Features
              </NavLink>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all transform hover:scale-105"
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

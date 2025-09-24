import React from "react";
import AppRoutes from "./router/AppRouter";
import Navbar from "./components/Navbar";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar at top */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1 p-4">
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;

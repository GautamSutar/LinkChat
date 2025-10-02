import React from "react";
import AppRoutes from "./router/AppRouter";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthProvider>
        <Navbar />
        <main className="flex-1 p-4">
          <AppRoutes />
        </main>
      </AuthProvider>

    </div>
  );
};

export default App;

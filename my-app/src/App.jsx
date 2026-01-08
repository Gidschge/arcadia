import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import Home from "./pages/Home.jsx";
import PlayGame from "./pages/PlayGame.jsx";
import LoginComponent from "./pages/login.jsx";

export default function App() {
  return (
    <Routes>
      {/* 1. Startseite ist der Login */}
      <Route path="/" element={<LoginComponent />} />

      {/* 2. Alle Arcade-Inhalte liegen unter /app */}
      <Route path="/app" element={<Layout />}>
        {/* /app zeigt die Home-Übersicht */}
        <Route index element={<Home />} />
        {/* /app/play/:gameId startet das Spiel */}
        <Route path="play/:gameId" element={<PlayGame />} />
      </Route>

      {/* 3. Fallback: Alles Unbekannte zurück zum Login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
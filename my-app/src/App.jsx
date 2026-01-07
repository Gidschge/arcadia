import { Routes, Route } from "react-router-dom";
import Layout from "./pages/layout.jsx";
import Home from "./pages/Home.jsx";
import PlayGame from "./pages/PlayGame.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/play/:gameId" element={<PlayGame />} />
      </Route>
    </Routes>
  );
}

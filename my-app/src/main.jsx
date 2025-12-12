import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";  // dein Login-Component
import Home from "./Home.jsx";      // deine Haupt-App
import './styles.css'
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />           {/* Start = Login */}
      <Route path="/app" element={<App />} />           {/* Haupt-App */}
      <Route path="/home" element={<Home />} />           {/* Haupt-App */}
      <Route path="*" element={<Navigate to="/" />} />  {/* Fallback */}
    </Routes>
  </BrowserRouter>
);



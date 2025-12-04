import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";  // dein Login-Component
import App from "./App";      // deine Haupt-App
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />           {/* Start = Login */}
      <Route path="/app" element={<App />} />           {/* Haupt-App */}
      <Route path="*" element={<Navigate to="/" />} />  {/* Fallback */}
    </Routes>
  </BrowserRouter>
);



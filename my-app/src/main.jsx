import "./index.css";   // <- GLOBAL (Layout, Farben, Grid)
import "./styles.css"; // <- Arcadia Design (Panels, Cards, etc.)

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error('Root element "#root" not found');

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

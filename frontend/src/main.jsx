import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./assets/css/main.css";
import App from "./App.jsx";

// 🌟 PREVENCIÓN FOUC: Inyecta el tema oscuro/claro de inmediato antes de que React despierte
if (
  localStorage.theme === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
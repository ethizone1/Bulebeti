import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-redirect legacy domain to maedbet.com
if (typeof window !== "undefined" && (window.location.hostname.includes("bulebeti.com") || window.location.hostname.includes("bulebet.com"))) {
  window.location.replace("https://maedbet.com" + window.location.pathname + window.location.search);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

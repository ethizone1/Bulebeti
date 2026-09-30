import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.jsx";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_KEY;

// Send legacy domains to the current one
if (
  typeof window !== "undefined" &&
  /(^|\.)bulebeti?\.com$/.test(window.location.hostname)
) {
  window.location.replace(
    "https://maedbet.com" + window.location.pathname + window.location.search,
  );
}

const MissingClerkKey = () => (
  <div style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "80px auto", padding: 24 }}>
    <h2>Sign-in is not configured</h2>
    <p>
      <code>VITE_CLERK_PUBLISHABLE_KEY</code> is not set. Copy the publishable key
      from your Clerk dashboard (API Keys) into <code>frontend/.env</code> and
      restart the dev server.
    </p>
  </div>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <MissingClerkKey />
    )}
  </StrictMode>,
);

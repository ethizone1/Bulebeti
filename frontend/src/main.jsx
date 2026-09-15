import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.jsx";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_KEY ||
  "pk_test_bXVsdGlwbGUtbWFjYXctNzguY2xlcmsuYWNjb3VudHMuZGV2JA";

// Auto-redirect legacy domain if needed
if (
  typeof window !== "undefined" &&
  (window.location.hostname.includes("bulebeti.com") ||
    window.location.hostname.includes("bulebet.com"))
) {
  window.location.replace(
    "https://bulebeti.com" + window.location.pathname + window.location.search,
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);

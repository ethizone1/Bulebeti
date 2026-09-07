const isProduction =
  import.meta.env.PROD || import.meta.env.MODE === "production";

const rawApiUrl = import.meta.env.VITE_API_URL;
// Normalize API URL to ensure frontend connects to active backend (bulebeti.onrender.com)
const apiUrl =
  rawApiUrl && !rawApiUrl.includes("bulebet-api")
    ? rawApiUrl
    : isProduction
      ? "https://bulebeti.onrender.com"
      : "http://localhost:5000";

const config = {
  API_URL: apiUrl,
};

export default config;

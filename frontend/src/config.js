// Base API URL configuration for the entire frontend
// In development, this falls back to localhost:5000.
// In production (Vercel/Netlify), set VITE_API_URL in the environment variables.
const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
};

export default config;

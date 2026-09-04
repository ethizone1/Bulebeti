const isProduction = import.meta.env.PROD || import.meta.env.MODE === "production";

const config = {
  API_URL:
    import.meta.env.VITE_API_URL ||
    (isProduction ? "https://bulebeti.onrender.com" : "http://localhost:5000"),
};

export default config;

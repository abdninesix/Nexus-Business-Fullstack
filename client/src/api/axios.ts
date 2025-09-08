// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? import.meta.env.VITE_API_BASE_URL_PROD
      : import.meta.env.VITE_API_BASE_URL_DEV,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

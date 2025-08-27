// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:3000/api",
  baseURL: "https://nexus-server-a951.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

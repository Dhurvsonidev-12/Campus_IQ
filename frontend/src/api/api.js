import axios from "axios"

export const API_BASE ="https://campus-iq-3.onrender.com "|| import.meta.env.VITE_API_URL || "http://localhost:8000" 

const API = axios.create({
  baseURL: API_BASE
})

export default API

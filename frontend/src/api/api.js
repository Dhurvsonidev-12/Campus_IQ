import axios from "axios"

export const API_BASE = "http://127.0.0.1:8000"

const API = axios.create({
  baseURL: API_BASE
})

export default API

import axios from "axios"
const BASE_URL = import.meta.env.MODE === "development" ?"https://movie-ticket-backend-517042119718.asia-southeast1.run.app/api" :"/api"
export  const axiosInstance = axios.create({
    baseURL:BASE_URL,
    withCredentials:true
})
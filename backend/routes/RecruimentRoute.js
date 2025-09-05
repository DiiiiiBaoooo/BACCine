import express from "express"
import { getJobbyCinema } from "../controller/Recruiment.js"

const RecruimentRoute = express.Router()

RecruimentRoute.get("/job/:cinema_id",getJobbyCinema)
export default RecruimentRoute;
import express from "express"
import { createShowTime, deleteShowTime, getShowTimeOnCinema, updateShowTime } from "../controller/ShowTimes.js";


const ShowTimeRoute = express.Router()
ShowTimeRoute.get("/cinema/:cinemaId", getShowTimeOnCinema);
ShowTimeRoute.post("/", createShowTime);
ShowTimeRoute.put("/:id", updateShowTime);
ShowTimeRoute.delete("/:id", deleteShowTime);

export default ShowTimeRoute
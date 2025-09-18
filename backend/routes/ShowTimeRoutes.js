import express from "express"
import { createShowTime, deleteShowTime, getAllShow, getCinemaByMovie, getShow, getShowTimeOnCinema, updateShowTime } from "../controller/ShowTimes.js";


const ShowTimeRoute = express.Router()
ShowTimeRoute.get("/cinema/:cinemaId", getShowTimeOnCinema);
ShowTimeRoute.get("/all",getAllShow);
ShowTimeRoute.get("/movies/:movie_id",getShow);

ShowTimeRoute.post("/", createShowTime);
ShowTimeRoute.put("/:id", updateShowTime);
ShowTimeRoute.delete("/:id", deleteShowTime);
ShowTimeRoute.get("/cinemas/:movie_id",getCinemaByMovie)

export default ShowTimeRoute
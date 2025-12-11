import express from "express"
import { createShowTime, deleteShowTime, getAllSeatsWithStatus, getAllShow, getCinemaByMovie, getOccupieSeat, getShow, getShowTimeByCine, getShowTimeOnCinema, suggestShowtimes, updateShowTime } from "../controller/ShowTimes.js";


const ShowTimeRoute = express.Router()
ShowTimeRoute.get("/cinema/:cinemaId", getShowTimeOnCinema);
ShowTimeRoute.get("/all",getAllShow);
ShowTimeRoute.get("/movies/:movie_id",getShow);
ShowTimeRoute.get("/seat/:showtimeId",getOccupieSeat)
ShowTimeRoute.get("/seats-status/:showtimeId", getAllSeatsWithStatus);
ShowTimeRoute.post("/suggest", suggestShowtimes);

ShowTimeRoute.get("/datve/:cinema_Id/:date",getShowTimeByCine)
ShowTimeRoute.post("/", createShowTime);
ShowTimeRoute.put("/:id", updateShowTime);
ShowTimeRoute.delete("/:id", deleteShowTime);
ShowTimeRoute.get("/cinemas/:movie_id",getCinemaByMovie)

export default ShowTimeRoute
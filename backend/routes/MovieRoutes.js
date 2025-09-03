import express from "express";
import { getAllMovies, getUpComingMovies, insert1Movie } from "../controller/Movies.js";
const movieRoute = express.Router()

movieRoute.get("/",getAllMovies);
movieRoute.get("/upcoming",getUpComingMovies)
movieRoute.post("/add-movie",insert1Movie)
export default movieRoute;
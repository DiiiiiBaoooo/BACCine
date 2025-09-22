import express from "express";
import { 
  getAllCinemas,
  addCinemaCluster, 
  updateCinemaCluster, 
  updateManagerCinema, 
  getManagers, 
  sendMoviePlan, 
  getPlanMovieByCinema, 
  getMoviesByCinema,
  getMoviePlanCinema
} from "../controller/Cinemas.js";

import { isAdmin, protectRoute } from "../middleware/protectRoute.js";

const CinemasRoute = express.Router();

// Các route ai cũng xem được
CinemasRoute.get('/', getAllCinemas);
CinemasRoute.get('/getPlanMovie/:cinema_id', getPlanMovieByCinema);

// Các route chỉ Admin mới được thao tác
CinemasRoute.post('/add', addCinemaCluster);
CinemasRoute.put('/update/:id', updateCinemaCluster);
CinemasRoute.put('/updateManager/:id', updateManagerCinema);
CinemasRoute.get('/managers', getManagers);
CinemasRoute.post('/sendPlan/:cinema_id', sendMoviePlan);
CinemasRoute.get('/:cinemaId/movies', getMoviesByCinema);
CinemasRoute.get('/:cinemaId/plan', getPlanMovieByCinema);
CinemasRoute.get('/planmovies/:cinema_id',getMoviePlanCinema)

export default CinemasRoute;

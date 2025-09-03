import express from "express";
import { 
  getAllCinemas,
  addCinemaCluster, 
  updateCinemaCluster, 
  updateManagerCinema, 
  getManagers, 
  sendMoviePlan, 
  getPlanMovieByCinema 
} from "../controller/Cinemas.js";

import { isAdmin, protectRoute } from "../middleware/protectRoute.js";

const CinemasRoute = express.Router();

// Các route ai cũng xem được
CinemasRoute.get('/', getAllCinemas);
CinemasRoute.get('/getPlanMovie/:cinema_id', getPlanMovieByCinema);

// Các route chỉ Admin mới được thao tác
CinemasRoute.post('/add', protectRoute, isAdmin, addCinemaCluster);
CinemasRoute.put('/update/:id', protectRoute, isAdmin, updateCinemaCluster);
CinemasRoute.put('/updateManager/:id', protectRoute, isAdmin, updateManagerCinema);
CinemasRoute.get('/managers', protectRoute, isAdmin, getManagers);
CinemasRoute.post('/sendPlan/:cinema_id', protectRoute, isAdmin, sendMoviePlan);

export default CinemasRoute;

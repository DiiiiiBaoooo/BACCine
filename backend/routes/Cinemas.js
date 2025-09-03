import express from "express"
import { getAllCinemas,addCinemaCluster, updateCinemaCluster, updateManagerCinema, getManagers, sendMoviePlan, getPlanMovieByCinema } from "../controller/Cinemas.js"

const CinemasRoute = express.Router()


CinemasRoute.get('/',getAllCinemas);
CinemasRoute.post('/add',addCinemaCluster)
CinemasRoute.put('/update/:id',updateCinemaCluster)
CinemasRoute.put('/updateManager/:id',updateManagerCinema)
CinemasRoute.get('/managers',getManagers)
CinemasRoute.post('/sendPlan/:cinema_id',sendMoviePlan)
CinemasRoute.get('/getPlanMovie/:cinema_id',getPlanMovieByCinema)

export default CinemasRoute;
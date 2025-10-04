import express  from "express"
import { getMyTickets } from "../controller/Users.js"
import { protectRoute } from "../middleware/protectRoute.js";

const UserRoute = express.Router()

UserRoute.get('/tickets',protectRoute,getMyTickets)
export default UserRoute;
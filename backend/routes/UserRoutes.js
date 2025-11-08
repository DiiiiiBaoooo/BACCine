import express  from "express"
import { getMyTickets, getTicketByOrderId } from "../controller/Users.js"
import { protectRoute } from "../middleware/protectRoute.js";

const UserRoute = express.Router()

UserRoute.get('/tickets',protectRoute,getMyTickets)
UserRoute.get('/tickets/:order_id', protectRoute, getTicketByOrderId);
export default UserRoute;
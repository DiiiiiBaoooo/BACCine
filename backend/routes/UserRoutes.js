import express  from "express"
import { cancelTicket, checkCancelTicket, getMyTickets, getTicketByOrderId } from "../controller/Users.js"
import { protectRoute } from "../middleware/protectRoute.js";

const UserRoute = express.Router()

UserRoute.get('/tickets',protectRoute,getMyTickets)
UserRoute.get('/tickets/:order_id', protectRoute, getTicketByOrderId);
UserRoute.post('/cancel/:orderId',protectRoute,cancelTicket)
UserRoute.get('/check-cancellable/:orderId',protectRoute,checkCancelTicket)
export default UserRoute;
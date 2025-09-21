import express from "express";
import { getTicketPriceCinema, getTicketPricesByCinemaAndDate, saveTicketPrices } from "../controller/TiketPrice.js";

const ticketPriceRoute = express.Router();
ticketPriceRoute.get("/:cinema_id",getTicketPriceCinema);
ticketPriceRoute.put("/updateprice/:cinema_id",saveTicketPrices);
ticketPriceRoute.get('/getprice/:cinemaId/:date',getTicketPricesByCinemaAndDate)

export default ticketPriceRoute;
import express from "express";
import { getTicketPriceCinema, saveTicketPrices } from "../controller/TiketPrice.js";

const ticketPriceRoute = express.Router();
ticketPriceRoute.get("/:cinema_id",getTicketPriceCinema);
ticketPriceRoute.put("/updateprice/:cinema_id",saveTicketPrices);

export default ticketPriceRoute;
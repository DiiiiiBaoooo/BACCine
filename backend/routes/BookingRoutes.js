import express from "express";
import { createBooking, getDetailOrder } from "../controller/Bookings.js";
const router = express.Router();
router.post("/create-booking",createBooking);
router.get("/getoderdetail/:id", getDetailOrder)
export default router;
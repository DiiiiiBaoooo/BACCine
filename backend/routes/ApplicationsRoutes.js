import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getApplicationByCine } from "../controller/Applications.js";


const ApplicationRoute = express.Router()


ApplicationRoute.get('/:cinema_id',getApplicationByCine)

export default ApplicationRoute
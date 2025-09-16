import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { acceptedApplication, getApplicationByCine } from "../controller/Applications.js";


const ApplicationRoute = express.Router()


ApplicationRoute.get('/:cinema_id',getApplicationByCine)
ApplicationRoute.post("/:id/accept", acceptedApplication);

export default ApplicationRoute
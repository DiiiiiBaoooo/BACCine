import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { acceptedApplication, getApplicationByCine, rejectedApplication } from "../controller/Applications.js";


const ApplicationRoute = express.Router()


ApplicationRoute.get('/:cinema_id',getApplicationByCine)
ApplicationRoute.post("/:id/accept", acceptedApplication);
ApplicationRoute.post("/:id/reject",rejectedApplication)

export default ApplicationRoute
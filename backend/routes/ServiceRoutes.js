import express from 'express'
import { addService, deleteService, getServices, updateService } from '../controller/Services.js'
import multer from "multer";

const ServiceRoute = express.Router()
const upload = multer({ dest: "uploads/" });
ServiceRoute.get('/:cinema_id', getServices)
ServiceRoute.post('/',upload.single("image"),addService)
ServiceRoute.put("/:id", upload.single("image"), updateService);
ServiceRoute.delete("/:id", deleteService);
export default ServiceRoute
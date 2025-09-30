import express from 'express'
import { addService, deleteService, getServiceActive, getServices, updateService } from '../controller/Services.js'
import multer from "multer";

const ServiceRoute = express.Router()
const upload = multer({ dest: "uploads/" });
ServiceRoute.get('/:cinema_id', getServices)
ServiceRoute.get('/active/:cinema_id', getServiceActive)

ServiceRoute.post('/',upload.single("image"),addService)
ServiceRoute.put("/:id", upload.single("image"), updateService);
ServiceRoute.delete("/:id", deleteService);
export default ServiceRoute
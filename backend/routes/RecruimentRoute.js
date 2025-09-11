import express from "express"
import { applyJob, createJob, deleteJob, getJob, getJobbyCinema, updateJob } from "../controller/Recruiment.js"
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
const RecruimentRoute = express.Router()
RecruimentRoute.post("/apply/:job_id", upload.single("resume"), applyJob);

RecruimentRoute.get("/job/:cinema_id",getJobbyCinema)
RecruimentRoute.get("/jobs/:cinema_id",getJob)
RecruimentRoute.post("/job", createJob);
RecruimentRoute.put("/job/:job_id", updateJob);
RecruimentRoute.delete("/job/:job_id", deleteJob);
export default RecruimentRoute;
import express from "express";
import { addVideo, getAllVideo, getVideoById } from "../controller/VideoController.js";
import multer from "multer";

// Cấu hình multer để nhận nhiều files
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize:3 * 1024 * 1024 * 1024// Giới hạn 500MB
  }
});

const VideoRoute = express.Router();

VideoRoute.get("/", getAllVideo);
VideoRoute.get("/:id", getVideoById);

// Nhận cả posterImage và videoFile
VideoRoute.post("/", upload.fields([
  { name: "posterImage", maxCount: 1 },
  { name: "videoFile", maxCount: 1 }
]), addVideo);

export default VideoRoute;
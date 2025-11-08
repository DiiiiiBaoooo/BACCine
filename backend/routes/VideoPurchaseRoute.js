import express from "express";
import { 
  checkVideoAccess, 
  purchaseVideo, 
  getMyPurchasedVideos,
  saveWatchProgress,
  getVideoWithPurchaseStatus,
  getAllVideosWithAccess
} from "../controller/VideoPurchaseController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const VideoPurchaseRoute = express.Router();

// Public routes
VideoPurchaseRoute.get("/", getAllVideosWithAccess); // Có thể xem danh sách khi chưa login

// Protected routes - Yêu cầu đăng nhập
VideoPurchaseRoute.get("/:id", protectRoute, getVideoWithPurchaseStatus);
VideoPurchaseRoute.get("/:video_id/access", protectRoute, checkVideoAccess);
VideoPurchaseRoute.post("/purchase", protectRoute, purchaseVideo);
VideoPurchaseRoute.get("/my-videos/purchased", protectRoute, getMyPurchasedVideos);
VideoPurchaseRoute.post("/watch-progress", protectRoute, saveWatchProgress);

export default VideoPurchaseRoute;
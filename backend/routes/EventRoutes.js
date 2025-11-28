import express from "express";
import {
  createEventRequest,
  getUserEventRequests,
  acceptQuote,
  cancelEventRequest,
  getManagerEventRequests,
  quoteEventRequest,
  rejectEventRequest,
  initiateEventPayment,
  checkEventRequestPaymentStatus
} from "../controller/EventRequest.js";
import { protectRoute } from "../middleware/protectRoute.js";

const EventRequestRoute = express.Router();

// ==================== USER ROUTES ====================

// Tạo yêu cầu tổ chức sự kiện (user đã login)
EventRequestRoute.post("/", protectRoute, createEventRequest);

// Lấy danh sách yêu cầu của user
// Query params: ?status=pending|quoted|accepted|rejected
EventRequestRoute.get("/my-requests",protectRoute,  getUserEventRequests);
EventRequestRoute.post("/:id/initiate-payment", protectRoute, initiateEventPayment);

// Chấp nhận báo giá
EventRequestRoute.patch("/:id/accept", protectRoute, acceptQuote);
EventRequestRoute.get("/payment-status/:id", checkEventRequestPaymentStatus);

// Hủy yêu cầu (chỉ khi pending)
EventRequestRoute.patch("/:id/cancel", protectRoute, cancelEventRequest);

// ==================== MANAGER ROUTES ====================

// Lấy danh sách yêu cầu cho manager quản lý
// Query params: ?status=pending|quoted&cinema_id=2
EventRequestRoute.get("/manager/requests",protectRoute,  getManagerEventRequests);

// Báo giá cho yêu cầu
// Body: { quoted_price: 5000000, quote_note: "...", room_id: 1 }
EventRequestRoute.patch("/manager/:id/quote", protectRoute, quoteEventRequest);

// Từ chối yêu cầu
// Body: { reason: "Không đủ phòng" }
EventRequestRoute.patch("/manager/:id/reject", protectRoute, rejectEventRequest);

export default EventRequestRoute;
import express from "express";
import cors from "cors";
import "dotenv/config";
import dbPool from "./config/mysqldb.js"; // Import the pool (renamed for clarity)
import movieRoute from "./routes/MovieRoutes.js";
import promotionRoute from "./routes/PromotionRoutes.js";
import http from "http";
import { Server } from "socket.io";
import membershiptiersRoute from "./routes/MembershipTier.js";
import CinemasRoute from "./routes/Cinemas.js";
import ticketPriceRoute from "./routes/TicketPriceRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import cookieParser from "cookie-parser";
import RecruimentRoute from "./routes/RecruimentRoute.js";
import ApplicationRoute from "./routes/ApplicationsRoutes.js";
import BlogRoute from "./routes/BlogRoutes.js";
import EmployeeRoute from "./routes/EmployeeRoutes.js";
import RoomRoute from "./routes/RoomRoutes.js";
import ShowTimeRoute from "./routes/ShowTimeRoutes.js";
import ServiceRoute from "./routes/ServiceRoutes.js";
import BookingRoute from "./routes/BookingRoutes.js";
import webhookrouter from "./routes/WebhookRoutes.js";
import UserRoute from "./routes/UserRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inggest/index.js"
import WorkScheduleRoute from "./routes/WorkScheduleRoutes.js";
import ChatbotRoute from "./routes/ChatBotRoutes.js";
import StreamVideoRoute from "./routes/StreamVideoRoute.js";
import VideoRoute from "./routes/VideoRoutes.js";
import VideoPurchaseRoute from "./routes/VideoPurchaseRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import ManagerRoute from "./routes/ManagerRoutes.js";
import reviewRoutes from './routes/reviewRoute.js';
import EventRequestRoute from "./routes/EventRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;   // Cloud Run sẽ set PORT=8080
// Middleware
app.use(express.json());
app.use(cookieParser());
// Thay toàn bộ đoạn cors cũ bằng cái này:
const allowedOrigins = [
  "https://bac-cine.vercel.app",     // Production
  "http://localhost:5173",           // Vite dev
  "http://localhost:3000",           // Nếu bạn dùng port khác
  "https://bac-cine-git-*.vercel.app", // Preview deploy (nếu cần)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, mobile, curl...)
      if (!origin || allowedOrigins.some(allowed => 
        origin === allowed || origin.startsWith(allowed.replace("https://", ""))
      )) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,  // BẬT ĐỂ COOKIE ĐƯỢC GỬI
  })
);


// Routes
app.get("/", (req, res) => res.send("Server is live"));
app.use("/api/movies", movieRoute);
app.use("/api/promotions", promotionRoute);
app.use("/api/membershiptiers", membershiptiersRoute);
app.use("/api/cinemas", CinemasRoute);
app.use("/api/ticketprice", ticketPriceRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/recruitments", RecruimentRoute);
app.use("/api/applications", ApplicationRoute);
app.use("/api/posts", BlogRoute);
app.use("/api/employee",EmployeeRoute);
app.use("/api/rooms",RoomRoute)
app.use("/api/showtimes",ShowTimeRoute)
app.use("/api/services", ServiceRoute)
app.use("/api/bookings", BookingRoute)
app.use("/api/webhook",webhookrouter)
app.use("/api/user", UserRoute)
app.use("/api/schedule", WorkScheduleRoute)
app.use("/api/stream", StreamVideoRoute);
app.use("/api/video", VideoRoute);
app.use("/api/video-purchase", VideoPurchaseRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", ManagerRoute);
app.use('/api/reviews', reviewRoutes);
app.use("/api/events", EventRequestRoute);
app.use("/api/inngest",serve({ client: inngest, functions }))
app.use("/api/chatbot", ChatbotRoute);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://bac-cine.vercel.app", "http://localhost:5173"],
    credentials: true,
  },
});

// Store io in global for controllers
global._io = io;

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start the server
// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Cloud Run URL: https://YOUR-SERVICE-HASH.a.run.app`);
});
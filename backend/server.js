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

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true,
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
app.use("/api/services/", ServiceRoute)
app.use("/api/bookings", BookingRoute)
app.use("/api/webhook",webhookrouter)
app.use("/api/user", UserRoute)
app.use("/api/inngest",serve({ client: inngest, functions }))

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
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
server.listen(port, () => console.log(`Server listening on ${port}`));
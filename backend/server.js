import express from "express";
import cors from "cors";
import "dotenv/config";
import connectMySqlDB from "./config/mysqldb.js";
import movieRoute from "./routes/MovieRoutes.js";
import promotionRoute from "./routes/PromotionRoutes.js";
import http from "http";          // thêm
import { Server } from "socket.io"; // thêm
import membershiptiersRoute from "./routes/MembershipTier.js";
import CinemasRoute from "./routes/Cinemas.js";
import ticketPriceRoute from "./routes/TicketPriceRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import cookieParser from "cookie-parser"

const app = express();
const port = 3000;

// kết nối DB
await connectMySqlDB();

app.use(express.json());
app.use(cookieParser())

app.use(cors({
  origin: "http://localhost:5173", // hoặc domain FE thật sự
  credentials: true
}));

// api
app.get("/", (req, res) => res.send("Server is live"));
app.use("/api/movies", movieRoute);
app.use("/api/promotions", promotionRoute);
app.use("/api/membershiptiers", membershiptiersRoute);
app.use("/api/cinemas",CinemasRoute)
app.use("/api/ticketprice",ticketPriceRoute)
app.use('/api/auth', AuthRoute)

// Tạo HTTP server thay vì app.listen
const server = http.createServer(app);

// Gắn Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // cho phép FE connect
    credentials: true
  },
});

// Lưu io vào biến global để controller emit được
global._io = io;

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(port, () => console.log(`Server listening on ${port}`));

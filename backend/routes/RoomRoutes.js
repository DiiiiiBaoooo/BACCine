import express from "express";
import { createRoom, getRoomById, getRoomsOfCinema, updateRoom } from "../controller/Rooms.js";


const RoomRoute = express.Router();

// Lấy tất cả phòng của 1 cinema cluster
RoomRoute.get("/cinema/:cinemaId", getRoomsOfCinema);

// Lấy chi tiết 1 phòng
RoomRoute.get("/:id", getRoomById);

// Thêm phòng chiếu
RoomRoute.post("/", createRoom);

// Cập nhật phòng chiếu
RoomRoute.put("/:id", updateRoom);

// Xóa phòng chiếu

export default RoomRoute;

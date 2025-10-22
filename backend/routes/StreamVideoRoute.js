import express from "express"
import { getM3U8File, getTSFile } from "../controller/StreamVideo.js";

const StreamVideoRoute = express.Router()
// Lấy file master.m3u8
StreamVideoRoute.get("/:folder/master.m3u8", getM3U8File);

// Lấy từng file .ts
StreamVideoRoute.get("/:folder/:segment", getTSFile);
export default StreamVideoRoute
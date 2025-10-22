import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

/**
 * Cấu trúc thư mục:
 * videos/
 *   ├── phim1/
 *   │   ├── master.m3u8
 *   │   ├── master0.ts
 *   │   ├── master1.ts
 *   │   └── ...
 *   ├── phim2/
 *   │   ├── master.m3u8
 *   │   └── ...
 */

// Route cho m3u8 playlist
router.get("/", async (req, res) => {
  const movieId = req.query.id; // Tên thư mục phim
  if (!movieId) return res.status(400).send("Thiếu movie ID!");

  const m3u8Path = path.join(process.cwd(), "videos", movieId, "master.m3u8");

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(m3u8Path)) {
    return res.status(404).send("Không tìm thấy file m3u8!");
  }

  try {
    // Đọc nội dung m3u8
    let m3u8Content = fs.readFileSync(m3u8Path, "utf-8");
    
    // Thay thế đường dẫn segments để trỏ đúng route
    // master0.ts → /api/stream/segment?id=phim1&file=master0.ts
    m3u8Content = m3u8Content.replace(
      /(master\d+\.ts)/g, 
      `/api/stream/segment?id=${movieId}&file=$1`
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache");
    res.send(m3u8Content);
  } catch (err) {
    console.error("Lỗi khi load m3u8:", err);
    res.status(500).send("Lỗi server khi đọc m3u8");
  }
});

// Route cho .ts segments
router.get("/segment", async (req, res) => {
  const { id: movieId, file } = req.query;
  
  if (!movieId || !file) {
    return res.status(400).send("Thiếu movieId hoặc tên file!");
  }

  // Chỉ cho phép file .ts để bảo mật
  if (!file.endsWith(".ts")) {
    return res.status(400).send("Chỉ chấp nhận file .ts!");
  }

  const segmentPath = path.join(process.cwd(), "videos", movieId, file);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(segmentPath)) {
    console.error(`Không tìm thấy segment: ${segmentPath}`);
    return res.status(404).send(`Không tìm thấy segment: ${file}`);
  }

  try {
    // Stream file .ts
    const stat = fs.statSync(segmentPath);
    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache 1 năm
    
    const stream = fs.createReadStream(segmentPath);
    stream.pipe(res);
  } catch (err) {
    console.error("Lỗi khi load segment:", err);
    res.status(500).send("Lỗi server khi stream segment");
  }
});

export default router;
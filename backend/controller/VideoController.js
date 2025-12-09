import dbPool from "../config/mysqldb.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import dotenv from "dotenv";
dotenv.config();

ffmpeg.setFfmpegPath(ffmpegPath);

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Helper function để gửi progress qua SSE
const sendProgress = (res, stage, percent, message) => {
  res.write(`data: ${JSON.stringify({ stage, percent, message })}\n\n`);
};

// Lấy danh sách tất cả phim
export const getAllVideo = async (req, res) => {
  try {
    const [rows] = await dbPool.query("SELECT * FROM video_library ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách phim:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách phim" });
  }
};

// Lấy chi tiết 1 phim theo video_id
export const getVideoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await dbPool.query("SELECT * FROM video_library WHERE video_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết phim:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm video mới với SSE progress
export const addVideo = async (req, res) => {
  const { videoTitle, folderName, price, rentalDuration, isFree } = req.body;
  const posterImage = req.files?.posterImage?.[0];
  const videoFile = req.files?.videoFile?.[0];
  let hlsOutputDir = null;
  let cloudinaryResult = null;

  // Thiết lập SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1️⃣ Kiểm tra các trường bắt buộc
    if (!videoTitle || !folderName || !posterImage || !videoFile) {
      sendProgress(res, 'error', 0, 'Vui lòng cung cấp đầy đủ thông tin');
      return res.end();
    }

    sendProgress(res, 'validation', 5, 'Đang xác thực dữ liệu...');

    // 2️⃣ Xử lý giá trị cho database
    const parsedIsFree = isFree === "1" || isFree === true ? 1 : 0;
    const parsedPrice = parsedIsFree ? 0 : (price ? parseFloat(price) : 0);
    let parsedRentalDuration = null;
    if (!parsedIsFree && rentalDuration && rentalDuration !== "NULL") {
      parsedRentalDuration = parseInt(rentalDuration, 10);
    }

    // 3️⃣ Tải ảnh poster lên Cloudinary
    sendProgress(res, 'upload_poster', 10, 'Đang tải ảnh poster...');
    cloudinaryResult = await cloudinary.uploader.upload(posterImage.path, {
      folder: `video_posters/${folderName}`,
      resource_type: "image",
    });
    sendProgress(res, 'upload_poster', 20, 'Tải ảnh poster thành công');

    // 4️⃣ Tạo thư mục tạm cho HLS output
    hlsOutputDir = path.join("./tmp", folderName);
    fs.mkdirSync(hlsOutputDir, { recursive: true });

    // 5️⃣ Convert MP4 -> HLS (.m3u8 + .ts)
    sendProgress(res, 'convert_hls', 25, 'Đang chuyển đổi video sang HLS...');
    
    await new Promise((resolve, reject) => {
      ffmpeg(videoFile.path)
        .outputOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 6",
          "-hls_list_size 0",
          "-hls_segment_type mpegts",
          "-hls_flags independent_segments",
          "-hls_playlist_type vod",
          "-f hls",
        ])
        .output(path.join(hlsOutputDir, "master.m3u8"))
        .on("progress", (progress) => {
          // FFmpeg progress (25% -> 55%)
          const percent = Math.min(25 + Math.floor(progress.percent * 0.3), 55);
          sendProgress(res, 'convert_hls', percent, `Chuyển đổi HLS: ${Math.floor(progress.percent)}%`);
        })
        .on("end", () => {
          sendProgress(res, 'convert_hls', 55, 'Chuyển đổi HLS thành công');
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Lỗi khi chuyển đổi HLS:", err);
          reject(err);
        })
        .run();
    });

    // 6️⃣ Upload HLS files lên S3
    sendProgress(res, 'upload_s3', 60, 'Đang upload lên S3...');
    const files = fs.readdirSync(hlsOutputDir);
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(hlsOutputDir, fileName);
      const fileStream = fs.createReadStream(filePath);
      
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${folderName}/${fileName}`,
          Body: fileStream,
          ContentType: fileName.endsWith(".m3u8") 
            ? "application/vnd.apple.mpegurl" 
            : "video/MP2T",
        })
      );
      
      // Progress từ 60% -> 85%
      const percent = Math.floor(60 + ((i + 1) / totalFiles) * 25);
      sendProgress(res, 'upload_s3', percent, `Upload S3: ${i + 1}/${totalFiles} files`);
    }
    sendProgress(res, 'upload_s3', 85, 'Upload S3 thành công');

    // 7️⃣ Lưu thông tin video vào database
    sendProgress(res, 'save_db', 90, 'Đang lưu thông tin vào database...');
    const [result] = await dbPool.query(
      `INSERT INTO video_library 
       (video_title, s3_folder_name, poster_image_url, price, rental_duration, is_free, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [videoTitle, folderName, cloudinaryResult.secure_url, parsedPrice, parsedRentalDuration, parsedIsFree]
    );

    const [newVideo] = await dbPool.query(
      "SELECT * FROM video_library WHERE video_id = ?", 
      [result.insertId]
    );
    sendProgress(res, 'save_db', 95, 'Lưu database thành công');

    // 8️⃣ Cleanup: Xóa files tạm
    sendProgress(res, 'cleanup', 98, 'Đang dọn dẹp files tạm...');
    if (hlsOutputDir && fs.existsSync(hlsOutputDir)) {
      fs.rmSync(hlsOutputDir, { recursive: true, force: true });
    }
    if (videoFile?.path && fs.existsSync(videoFile.path)) {
      fs.unlinkSync(videoFile.path);
    }
    if (posterImage?.path && fs.existsSync(posterImage.path)) {
      fs.unlinkSync(posterImage.path);
    }

    // 9️⃣ Gửi kết quả cuối cùng
    sendProgress(res, 'complete', 100, 'Hoàn thành');
    res.write(`data: ${JSON.stringify({ 
      status: 'success', 
      video: newVideo[0] 
    })}\n\n`);
    res.end();

  } catch (error) {
    console.error("❌ Lỗi khi thêm phim:", error);
    
    // Cleanup khi có lỗi
    try {
      if (hlsOutputDir && fs.existsSync(hlsOutputDir)) {
        fs.rmSync(hlsOutputDir, { recursive: true, force: true });
      }
      if (videoFile?.path && fs.existsSync(videoFile.path)) {
        fs.unlinkSync(videoFile.path);
      }
      if (posterImage?.path && fs.existsSync(posterImage.path)) {
        fs.unlinkSync(posterImage.path);
      }
    } catch (cleanupError) {
      console.error("❌ Lỗi khi cleanup files:", cleanupError);
    }

    sendProgress(res, 'error', 0, error.message);
    res.end();
  }
};
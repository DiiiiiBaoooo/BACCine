import dbPool from "../config/mysqldb.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import dotenv from "dotenv";
dotenv.config();

// Cấu hình đường dẫn ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Khởi tạo S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

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

// Thêm video mới
export const addVideo = async (req, res) => {
  const { videoTitle, folderName } = req.body;
  const posterImage = req.files?.posterImage?.[0];
  const videoFile = req.files?.videoFile?.[0];

  let hlsOutputDir = null;
  let cloudinaryResult = null;

  try {
    // 1️⃣ Kiểm tra các trường bắt buộc
    if (!videoTitle || !folderName || !posterImage || !videoFile) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp đầy đủ thông tin: videoTitle, folderName, posterImage, videoFile" 
      });
    }

    // 2️⃣ Tải ảnh poster lên Cloudinary
    cloudinaryResult = await cloudinary.uploader.upload(posterImage.path, {
      folder: `video_posters/${folderName}`,
      resource_type: "image",
    });

    // 3️⃣ Tạo thư mục tạm cho HLS output
    hlsOutputDir = path.join("./tmp", folderName);
    fs.mkdirSync(hlsOutputDir, { recursive: true });

    // 4️⃣ Convert MP4 -> HLS (.m3u8 + .ts)
    console.log("🎬 Đang chuyển đổi video sang HLS...");
    await new Promise((resolve, reject) => {
      ffmpeg(videoFile.path)
        .outputOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 10",        // mỗi segment 10s
          "-hls_list_size 0",
          "-f hls"
        ])
        .output(path.join(hlsOutputDir, "master.m3u8"))
        .on("end", () => {
          console.log("✅ Chuyển đổi HLS thành công");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Lỗi khi chuyển đổi HLS:", err);
          reject(err);
        })
        .run();
    });

    // 5️⃣ Upload HLS files lên S3
    console.log("☁️ Đang upload lên S3...");
    const files = fs.readdirSync(hlsOutputDir);
    for (const fileName of files) {
      const filePath = path.join(hlsOutputDir, fileName);
      const fileStream = fs.createReadStream(filePath);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${folderName}/${fileName}`,
        Body: fileStream,
        ContentType: fileName.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
      }));
    }
    console.log("✅ Upload S3 thành công");

    // 6️⃣ Lưu thông tin video vào database
    const [result] = await dbPool.query(
      "INSERT INTO video_library (video_title, s3_folder_name, poster_image_url, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [videoTitle, folderName, cloudinaryResult.secure_url]
    );

    // 7️⃣ Lấy thông tin video vừa thêm
    const [newVideo] = await dbPool.query("SELECT * FROM video_library WHERE video_id = ?", [result.insertId]);

    // 8️⃣ Cleanup: Xóa files tạm
    if (hlsOutputDir && fs.existsSync(hlsOutputDir)) {
      fs.rmSync(hlsOutputDir, { recursive: true, force: true });
    }
    if (videoFile?.path && fs.existsSync(videoFile.path)) {
      fs.unlinkSync(videoFile.path);
    }
    if (posterImage?.path && fs.existsSync(posterImage.path)) {
      fs.unlinkSync(posterImage.path);
    }

    res.status(200).json({
      message: "Thêm phim thành công",
      video: newVideo[0],
    });

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

    res.status(500).json({ 
      message: "Lỗi server khi thêm phim",
      error: error.message 
    });
  }
};
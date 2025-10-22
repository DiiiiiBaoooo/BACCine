import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// 📌 Stream master.m3u8
export const getM3U8File = async (req, res) => {
  const folder = req.params.folder;
  const key = `${folder}/master.m3u8`;

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const data = await s3.send(command);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    data.Body.pipe(res);
  } catch (error) {
    console.error("❌ Lỗi tải master.m3u8:", error);
    res.status(404).json({ message: "master.m3u8 not found" });
  }
};

// 📌 Stream file .ts
export const getTSFile = async (req, res) => {
  const folder = req.params.folder;
  const segment = req.params.segment;
  const key = `${folder}/${segment}`;

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const data = await s3.send(command);

    res.setHeader("Content-Type", "video/mp2t");
    data.Body.pipe(res);
  } catch (error) {
    console.error("❌ Lỗi tải segment:", error);
    res.status(404).json({ message: "TS segment not found" });
  }
};

import dbPool from "../config/mysqldb.js";
import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import streamifier from "streamifier";

const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage }).single("image"); // 'image' is the field name
export const getPostsInCine = async (req, res) => {
  try {
    const { cinema_id } = req.params;
    const [rows] = await dbPool.query("SELECT * FROM posts WHERE cinema_id = ?", [
      cinema_id,
    ]);
    if (rows.length === 0) {
      return res.status(200).json({ success: true, posts: [], message: "Chưa có bài viết nào" });
    }
    res.status(200).json({ success: true, posts: rows });
  } catch (error) {
    console.error("Error in getPostsInCine:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const createPost = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err.message);
      return res.status(400).json({ error: "Lỗi khi tải lên hình ảnh: " + err.message });
    }

    try {
      const { title,description, content, status } = req.body;
      const { cinema_id } = req.params;
      let image_url  = null;

      // Upload image to Cloudinary if provided
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "blog_posts", resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        image_url  = uploadResult.secure_url;
      }

      const [result] = await dbPool.query(
        "INSERT INTO posts (title, content,description, status, cinema_id, image_url ) VALUES (?, ?,?, ?, ?, ?)",
        [title, content,description, status, cinema_id, image_url ]
      );

      const newPost = { id: result.insertId, title, content, status, cinema_id, image_url  };
      global._io.emit("newPost", newPost);
      res.status(201).json({ success: true, post: newPost });
    } catch (error) {
      console.error("Error in createPost:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
};


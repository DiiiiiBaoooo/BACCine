import jwt from "jsonwebtoken";
import connectMySqlDB from "../config/mysqldb.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - no token provided" });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    // connect DB
    const connection = await connectMySqlDB();
    const [rows] = await connection.query(
      "SELECT id, name, email, role, profilePicture FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized - user not found" });
    }

    req.user = rows[0]; // gán user vào request
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
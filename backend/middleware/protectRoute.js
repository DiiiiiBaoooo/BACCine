import jwt from "jsonwebtoken";
import connectMySqlDB from "../config/mysqldb.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - no token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded); // Log decoded token

    // Connect DB
    const connection = await connectMySqlDB();
    const [rows] = await connection.query(
      "SELECT id, name, phone, province_code, district_code, email, role, profilePicture, isUpdateProfile FROM users WHERE id = ?",
      [decoded.id]
    );

    console.log("Database query result:", rows); // Log query result

    if (rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized - user not found" });
    }

    req.user = rows[0]; // Assign user to request
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export async function isAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - no user in request" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - require admin role" });
    }

    next(); // cho qua nếu đúng admin
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
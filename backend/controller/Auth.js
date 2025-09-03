import connectMySqlDB from "../config/mysqldb.js";
import bcrypt from "bcrypt";
import jwt from  "jsonwebtoken"

export const signup = async (req, res) => {
    try {
        const connection = await connectMySqlDB();
        const { fullName, email, password } = req.body;
        if(!fullName || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if(password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        const [existRows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        if(existRows.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const seed = Math.random().toString(36).substring(2, 10);
        const randomAvatar = `https://robohash.org/${seed}.png`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [rows] = await connection.query("INSERT INTO users (name, email, password,role,profilePicture) VALUES (?, ?, ?,'user',?)", [fullName, email, hashedPassword,randomAvatar]);
        res.status(200).json({success:true, user:rows ,message:"Đăng kí thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function login(req, res) {
    const { email, password } = req.body;
  
    try {
      if (!email || !password) {
        return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
      }
  
      const connection = await connectMySqlDB();
      const [rows] = await connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
  
      if (rows.length === 0) {
        return res.status(400).json({ error: "Email chưa được đăng ký" });
      }
  
      const user = rows[0];
  
      // kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Mật khẩu không đúng" });
      }
  
      // tạo JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "mySecretKey",
        { expiresIn: "7d" }
      );
  
      // set cookie
      res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
  
      // xoá password khỏi response
      const { password: _, ...userWithoutPassword } = user;
  
      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }



export async function updateProfile(req, res) {
  try {
    const connection = await connectMySqlDB();
    const userID = req.user.id; // sửa lại
    const { name, province_code, district_code, phone } = req.body;

    // Validate input
    if (!name || !province_code || !district_code || !phone) {
      return res.status(400).json({
        message: "Thiếu thông tin!",
        missingFields: [
          !name && "name",
          !province_code && "province_code",
          !district_code && "district_code",
          !phone && "phone",
        ].filter(Boolean),
      });
    }

    // Update user
    const [result] = await connection.execute(
      `UPDATE users 
       SET name = ?, province_code = ?, district_code = ?, phone = ? 
       WHERE id = ?`,
      [name, province_code, district_code, phone, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy user!" });
    }

    // Lấy lại user đã update để return
    const [rows] = await connection.execute(
      `SELECT id, name, province_code, district_code, phone, email 
       FROM users 
       WHERE id = ?`,
      [userID]
    );

    return res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
}
// export const getAuthUser = async (req,res) => {
//     try {
//         const connection = await connectMySqlDB();



        
//     } catch (error) {
//         console.error("getAuthUser  error:", error);
//         return res.status(500).json({ message: "Lỗi server!", error: error.message });
//     }
    
// }
import dbPool from "../config/mysqldb.js";
import bcrypt from "bcrypt";
import jwt from  "jsonwebtoken"
import { OAuth2Client } from "google-auth-library";
import passport from "passport";

import { Strategy as FacebookStrategy } from "passport-facebook";


export const signup = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        if(!fullName || !email || !password) {
            return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
        }
        
        if(password.length < 6) {
            return res.status(400).json({ error: "Mật khẩu phải dài ít nhất 6 ký tự" });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "Email không hợp lệ" });
        }
        
        const [existRows] = await dbPool.query("SELECT * FROM users WHERE email = ?", [email]);
        if(existRows.length > 0) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }
        
        const seed = Math.random().toString(36).substring(2, 10);
        const randomAvatar = `https://robohash.org/${seed}.png`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [rows] = await dbPool.query(
            "INSERT INTO users (name, email, password, role, profilePicture, is_active) VALUES (?, ?, ?, 'user', ?, 1)", 
            [fullName, email, hashedPassword, randomAvatar]
        );
        
        res.status(200).json({
            success: true, 
            user: rows,
            message: "Đăng ký thành công" 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: "Lỗi hệ thống, vui lòng thử lại sau" });
    }
}

export async function login(req, res) {
    const { email, password } = req.body;
  
    try {
      if (!email || !password) {
        return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
      }
  
      const [rows] = await dbPool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
  
      if (rows.length === 0) {
        return res.status(400).json({ error: "Email chưa được đăng ký" });
      }
  
      const user = rows[0];

      // ✅ Kiểm tra tài khoản có bị vô hiệu hóa không
      if (user.is_active === 0) {
        return res.status(403).json({ 
          error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ." 
        });
      }
  
      // kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Mật khẩu không đúng" });
      }
  
      await dbPool.query("UPDATE users SET isOnline = true WHERE id = ?", [user.id]);

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
        sameSite: "none",
        secure: true
        
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
    const userID = req.user.id; // sửa lại
    const { name, province_code, district_code, phone, profilePicture } = req.body;

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
    const [result] = await dbPool.execute(
      `UPDATE users 
       SET name = ?, province_code = ?, district_code = ?, phone = ?, profilePicture = ?, isUpdateProfile = ?
       WHERE id = ?`,
      [name, province_code, district_code, phone, profilePicture, 1, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy user!" });
    }

    // Lấy lại user đã update để return
    const [rows] = await dbPool.execute(
      `SELECT id, name, province_code, district_code, phone, email, profilePicture, isOnline
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

// Logout
export async function logout(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // CẦN PHẢI CÓ ĐỦ OPTION GIỐNG KHI SET
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    await dbPool.query("UPDATE users SET isOnline = false WHERE id = ?", [user.id]);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm tạo JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check user
    const [rows] = await dbPool.query(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [googleId, email]
    );

    let user;
    if (rows.length === 0) {
      const [result] = await dbPool.query(
        `INSERT INTO users (name, email, profilePicture, role, isUpdateProfile, google_id, isOnline, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, picture, "user", 0, googleId, true, 1]
      );

      user = { 
        id: result.insertId, 
        name, 
        email, 
        profilePicture: picture, 
        role: "user", 
        google_id: googleId,
        is_active: 1 
      };
    } else {
      user = rows[0];

      // ✅ Kiểm tra tài khoản có bị vô hiệu hóa không
      if (user.is_active === 0) {
        return res.status(403).json({ 
          message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ." 
        });
      }

      if (!user.google_id) {
        await dbPool.query("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
        user.google_id = googleId;
      }
    }

    await dbPool.query("UPDATE users SET isOnline = true WHERE id = ?", [user.id]);

    // 👉 Sinh JWT backend
    const jwtToken = generateToken(user);

    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Google login success",
      user,
      token: jwtToken,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Google login failed" });
  }
};

export const getAuthUser = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Kiểm tra tài khoản có bị vô hiệu hóa không
    const [userCheck] = await dbPool.execute(
      `SELECT is_active FROM users WHERE id = ?`,
      [user.id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại"
      });
    }

    if (userCheck[0].is_active === 0) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."
      });
    }

    // If user is a manager, fetch their cinemaId
    if (user.role === "manager") {
      const [rows] = await dbPool.execute(
        `SELECT id FROM cinema_clusters WHERE manager_id = ?`,
        [user.id]
      );
      
      if (rows && rows.length > 0) {
        user.cinemaId = rows[0].id;
      }
    }

    if (user.role === "employee") {
      const [rows] = await dbPool.execute(
        `SELECT cinema_cluster_id, position, employee_id FROM employee_cinema_cluster WHERE employee_id = ?`,
        [user.id]
      );

      if (rows && rows.length > 0) {
        user.cinemaId = rows[0].cinema_cluster_id;
        user.position = rows[0].position;
        user.employee_id = rows[0].employee_id;
      }
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Lỗi get /me:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function getTokens(code) {
  try {
    const res = await axios.post("https://oauth2.googleapis.com/token", {
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:
        "https://movie-ticket-backend-517042119718.asia-southeast1.run.app/api/auth/google/callback",
      grant_type: "authorization_code",
    });

    console.log("TOKEN DATA:", res.data);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}

// 👉 Dán code vừa lấy từ Google vào đây
const CODE = "4/0Ab32j93d7DBibZ06BCttJmwNXP9O3SY36CQkgAXCJllVu0Lxiq0LF7ghMtQ0zcj16UaVZA";

getTokens(CODE);

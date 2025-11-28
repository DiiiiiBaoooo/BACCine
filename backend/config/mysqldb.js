import mysql from "mysql2/promise";

const isProduction = process.env.NODE_ENV === "production";

const pool = mysql.createPool({
  // Nếu có INSTANCE_CONNECTION_NAME thì dùng Unix Socket (Cloud Run)
  // Nếu không thì dùng host (Local development)
  ...(process.env.INSTANCE_CONNECTION_NAME
    ? {
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      }
    : {
        host: process.env.DB_HOST || "localhost",
      }),
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "csdl_rapphim",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Database connected successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

export default pool;
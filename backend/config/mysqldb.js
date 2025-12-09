import mysql from "mysql2/promise";

const isProduction = process.env.NODE_ENV === "production";
const isCloudRun = process.env.K_SERVICE !== undefined;

const pool = mysql.createPool({
  ...(isCloudRun && process.env.INSTANCE_CONNECTION_NAME
    ? {
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
      }),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "csdl_rapphim",
    timezone: '+07:00', // ✅ QUAN TRỌNG: Set timezone VN

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// ========== TẮT ONLY_FULL_GROUP_BY ==========
// pool.on('connection', (connection) => {
//   connection.query(
//     `SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'`,
//     (error) => {
//       if (error) {
//         console.error('❌ Failed to set sql_mode:', error);
//       }
//     }
//   );
// });

// Test connection
pool
  .getConnection()
  .then(async (conn) => {
    console.log("✅ Database connected successfully");
    console.log(`🔌 Connection type: ${isCloudRun ? 'Unix Socket (Cloud Run)' : 'TCP (Local)'}`);
    
    // Set sql_mode ngay lập tức
    // await conn.query(`SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'`);
    
    const [result] = await conn.query('SELECT @@sql_mode as mode');
    console.log('📋 SQL Mode:', result[0].mode);
    
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

export default pool;
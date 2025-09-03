import mysql from "mysql2/promise";

const connectMySqlDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "csdl_rapphim",
    });
    console.log("Kết nối MySQL thành công!",+ connection.threadId);
    
    return connection;
  } catch (error) {
    console.error("Lỗi kết nối MySQL: " + error.message);
  }
};

export default connectMySqlDB;

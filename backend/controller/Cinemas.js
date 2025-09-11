// routes/Cinemas.js
import dbPool from "../config/mysqldb.js";

export const getAllCinemas = async (req, res) => {
  try {


    const [rows] = await dbPool.query(`
      SELECT 
        cc.id,
        cc.name AS cinema_name,
        cc.province_code,
        cc.district_code,
        cc.address,
        cc.description,
        cc.phone AS cinema_phone,
        cc.rooms,
        cc.status,
        cc.phone,
        cc.email,
        u.id AS manager_id,
        u.name AS manager_name,
        u.phone AS manager_phone,
        COUNT(ecc.employee_id) AS staffCount
      FROM cinema_clusters cc
      JOIN users u ON cc.manager_id = u.id
      LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
      GROUP BY cc.id
    `);

    res.status(200).json({ success: true, cinemas: rows });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
export const getCinemas = async (req, res) => {
  try {
    const [rows] = await dbPool.query("SELECT id, name FROM cinemas");
    res.status(200).json({ success: true, cinemas: rows });
  } catch (error) {
    console.error("Error in getCinemas:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const addCinemaCluster = async (req, res) => {
  try {
    const {
      name,
      description,
      manager_id,
      phone,
      email,
      province_code,
      district_code,
      address_details,
      rooms,
    } = req.body;

    // Insert into DB
    const [result] = await dbPool.execute(
      `INSERT INTO cinema_clusters 
      (name, description, manager_id, phone, email, province_code, district_code, address, rooms) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        manager_id,
        phone,
        email,
        province_code,
        district_code,
        address_details,
        rooms,
      ]
    );

    // Fetch the newly added cinema to include in the event
    const [newCinema] = await dbPool.query(
      `SELECT 
        cc.id,
        cc.name AS cinema_name,
        cc.province_code,
        cc.district_code,
        cc.address,
        cc.description,
        cc.phone AS cinema_phone,
        cc.rooms,
        cc.status,
        cc.phone,
        cc.email,
        u.id AS manager_id,
        u.name AS manager_name,
        u.phone AS manager_phone,
        COUNT(ecc.employee_id) AS staffCount
      FROM cinema_clusters cc
      JOIN users u ON cc.manager_id = u.id
      LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
      WHERE cc.id = ?
      GROUP BY cc.id`,
      [result.insertId]
    );

    // Emit WebSocket event
    global._io.emit("cinemaAdded", newCinema[0]);

    return res.status(201).json({
      success: true,
      message: "Thêm cụm rạp thành công",
      data: result,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const updateCinemaCluster = async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      province_code,
      district_code,
      address_details,
      rooms,
    } = req.body;
    const { id } = req.params;

    const [idCinema] = await dbPool.query(`SELECT id FROM cinema_clusters WHERE id = ?`, [id]);
    if (!idCinema.length) {
      return res.status(400).json({ success: false, message: "Chưa chọn rạp" });
    }

    const [result] = await dbPool.execute(
      `UPDATE cinema_clusters 
       SET name = ?, description = ?, phone = ?, email = ?, 
           province_code = ?, district_code = ?, address = ?, rooms = ?
       WHERE id = ?`,
      [
        name,
        description,
        phone,
        email,
        province_code,
        district_code,
        address_details,
        rooms,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cụm rạp" });
    }

    // Fetch the updated cinema to include in the event
    const [updatedCinema] = await dbPool.query(
      `SELECT 
        cc.id,
        cc.name AS cinema_name,
        cc.province_code,
        cc.district_code,
        cc.address,
        cc.description,
        cc.phone AS cinema_phone,
        cc.rooms,
        cc.status,
        cc.phone,
        cc.email,
        u.id AS manager_id,
        u.name AS manager_name,
        u.phone AS manager_phone,
        COUNT(ecc.employee_id) AS staffCount
      FROM cinema_clusters cc
      JOIN users u ON cc.manager_id = u.id
      LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
      WHERE cc.id = ?
      GROUP BY cc.id`,
      [id]
    );

    // Emit WebSocket event
    global._io.emit("cinemaUpdated", updatedCinema[0]);

    return res.status(200).json({
      success: true,
      message: "Cập nhật cụm rạp thành công",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const updateManagerCinema = async (req, res) => {
  try {
    const { id } = req.params;
    const { manager_id } = req.body;

    const [manager] = await dbPool.query("SELECT id FROM users WHERE id = ?", [manager_id]);
    if (!manager.length) {
      return res.status(400).json({ success: false, message: "Không tìm thấy quản lý" });
    }

    const [result] = await dbPool.execute(
      `UPDATE cinema_clusters 
       SET manager_id = ?
       WHERE id = ?`,
      [manager_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cụm rạp" });
    }

    // Fetch the updated cinema to include in the event
    const [updatedCinema] = await dbPool.query(
      `SELECT 
        cc.id,
        cc.name AS cinema_name,
       cc.province_code,
        cc.district_code,
        cc.address,
        cc.description,
        cc.phone AS cinema_phone,
        cc.rooms,
        cc.status,
        cc.phone,
        cc.email,
        u.id AS manager_id,
        u.name AS manager_name,
        u.phone AS manager_phone,
        COUNT(ecc.employee_id) AS staffCount
      FROM cinema_clusters cc
      JOIN users u ON cc.manager_id = u.id
      LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
      WHERE cc.id = ?
      GROUP BY cc.id`,
      [id]
    );

    // Emit WebSocket event
    global._io.emit("cinemaUpdated", updatedCinema[0]);

    return res.status(200).json({
      success: true,
      message: "Cập nhật quản lý rạp thành công",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getManagers = async (req, res) => {
  try {
    const [rows] = await dbPool.query("SELECT * FROM users WHERE role = 'manager'");
    res.status(200).json({ success: true, managers: rows });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const sendMoviePlan = async (req, res) => {
  try {
    const { description, start_date, end_date, movie_id } = req.body;
    const { cinema_id } = req.params;

    if (!cinema_id || !description || !movie_id || movie_id.length === 0) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Chuẩn hóa giá trị NULL
    const safeStart = start_date || null;
    const safeEnd = end_date || null;

    // 1. Thêm kế hoạch
    const [planResult] = await dbPool.execute(
      `INSERT INTO business_plan (cinema_id, description, start_date, end_date, created_by) 
       VALUES (?, ?, ?, ?, 1)`,
      [cinema_id, description, safeStart, safeEnd]
    );

    const planId = planResult.insertId;

    // 2. Chuẩn hóa movie_id thành mảng
    const movies = Array.isArray(movie_id) ? movie_id : [movie_id];

    // 3. Insert phim vào bảng business_plan_movies
    const values = movies.map((mid) => [planId, mid, null]);
    await dbPool.query(
      `INSERT INTO business_plan_movies (plan_id, movie_id, note) VALUES ?`,
      [values]
    );

    res
      .status(201)
      .json({ message: "Thêm kế hoạch thành công", plan_id: planId });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi khi thêm kế hoạch", error: error.message });
  }
};

export const getPlanMovieByCinema = async (req, res) => {
  try {
    const { cinema_id } = req.params;

    const [rows] = await dbPool.query(
      `SELECT 
          bl.id AS plan_id,
          bl.description,
          bl.start_date,
          bl.end_date,
          COUNT(bpm.movie_id) AS total_movies,
          GROUP_CONCAT(m.title SEPARATOR ', ') AS movie_list
       FROM business_plan bl
       JOIN business_plan_movies bpm ON bl.id = bpm.plan_id
       JOIN movies m ON bpm.movie_id = m.id
       WHERE bl.cinema_id = ?
       GROUP BY bl.id, bl.description, bl.start_date, bl.end_date
       ORDER BY bl.created_at DESC`,
      [cinema_id]
    );

    res.status(200).json({success:true, plans: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy kế hoạch", error: error.message });
  }
};

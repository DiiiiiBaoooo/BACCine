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
        cc.email,
        u.id AS manager_id,
        u.name AS manager_name,
        u.phone AS manager_phone,
        COUNT(ecc.employee_id) AS staffCount
      FROM cinema_clusters cc
      LEFT JOIN users u ON cc.manager_id = u.id AND u.role = 'manager'  -- Thêm điều kiện role
      LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
      GROUP BY cc.id, cc.name, cc.province_code, cc.district_code, cc.address, 
               cc.description, cc.phone, cc.rooms, cc.status, cc.email,
               u.id, u.name, u.phone
      ORDER BY cc.name ASC
    `);

    // Đảm bảo luôn trả về mảng, kể cả rạp chưa có quản lý
    const cinemas = rows.map(row => ({
      ...row,
      manager_id: row.manager_id || null,
      manager_name: row.manager_name || null,
      manager_phone: row.manager_phone || null,
    }));

    res.status(200).json({ success: true, cinemas });
  } catch (error) {
    console.error("Lỗi getAllCinemas:", error.message);
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

// backend/controllers/cinemaController.js (hoặc file tương tự)

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

    // 1. Kiểm tra các trường bắt buộc
    if (!name || !manager_id || !province_code || !district_code || !rooms) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // 2. Kiểm tra tên rạp đã tồn tại chưa (không phân biệt hoa thường)
    const [existingCinema] = await dbPool.query(
      `SELECT id FROM cinema_clusters WHERE LOWER(name) = LOWER(?)`,
      [name.trim()]
    );

    if (existingCinema.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Tên cụm rạp đã tồn tại. Vui lòng chọn tên khác.",
      });
    }

    // 3. Kiểm tra quản lý đã được gán cho rạp khác chưa
    const [managerInUse] = await dbPool.query(
      `SELECT cc.id, cc.name AS cinema_name 
       FROM cinema_clusters cc 
       WHERE cc.manager_id = ? AND cc.id != ?`,
      [manager_id, 0] // id = 0 để tránh ảnh hưởng khi thêm mới
    );

    if (managerInUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Quản lý này đang phụ trách rạp "${managerInUse[0].cinema_name}". Mỗi quản lý chỉ được gán cho một cụm rạp.`,
      });
    }

    // 4. Kiểm tra manager_id có tồn tại và đúng role không
    const [manager] = await dbPool.query(
      `SELECT id, name FROM users WHERE id = ? AND role = 'manager'`,
      [manager_id]
    );

    if (!manager.length) {
      return res.status(400).json({
        success: false,
        message: "Quản lý không tồn tại hoặc không hợp lệ",
      });
    }

    // 5. Thêm cụm rạp mới
    const [result] = await dbPool.execute(
      `INSERT INTO cinema_clusters 
       (name, description, manager_id, phone, email, province_code, district_code, address, rooms, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        description || null,
        manager_id,
        phone || null,
        email || null,
        province_code,
        district_code,
        address_details || null,
        rooms,
      ]
    );

    // 6. Lấy thông tin rạp mới để emit socket
    const [newCinemaRows] = await dbPool.query(
      `SELECT 
          cc.id,
          cc.name AS cinema_name,
          cc.province_code,
          cc.district_code,
          cc.address,
          cc.description,
          cc.phone,
          cc.email,
          cc.rooms,
          cc.status,
          u.id AS manager_id,
          u.name AS manager_name,
          COUNT(ecc.employee_id) AS staffCount
       FROM cinema_clusters cc
       JOIN users u ON cc.manager_id = u.id
       LEFT JOIN employee_cinema_cluster ecc ON cc.id = ecc.cinema_cluster_id
       WHERE cc.id = ?
       GROUP BY cc.id`,
      [result.insertId]
    );

    const newCinema = newCinemaRows[0];

    // Emit socket để cập nhật realtime
    global._io?.emit("cinemaAdded", newCinema);

    return res.status(201).json({
      success: true,
      message: "Thêm cụm rạp thành công!",
      cinema: newCinema,
    });
  } catch (error) {
    console.error("Lỗi thêm cụm rạp:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

export const updateCinemaCluster = async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      manager_id,
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
const [nameExists] = await dbPool.query(
  `SELECT id FROM cinema_clusters WHERE LOWER(name) = LOWER(?) AND id != ?`,
  [name.trim(), id]
);

if (nameExists.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Tên cụm rạp đã được sử dụng bởi rạp khác",
  });
}

// Kiểm tra quản lý có đang quản lý rạp khác không (nếu đổi quản lý)
if (manager_id) {
  const [managerInUse] = await dbPool.query(
    `SELECT name FROM cinema_clusters WHERE manager_id = ? AND id != ?`,
    [manager_id, id]
  );
  if (managerInUse.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Quản lý này đang phụ trách rạp "${managerInUse[0].name}"`,
    });
  }
}
    const [result] = await dbPool.execute(
      `UPDATE cinema_clusters 
       SET name = ?, description = ?, phone = ?, email = ?, 
           province_code = ?, district_code = ?, address = ?, rooms = ?,manager_id = ?
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
        manager_id,
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

    res.status(200).json({ success: true, plans: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy kế hoạch", error: error.message });
  }
};

export const getMoviesByCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    const [rows] = await dbPool.query(
      `SELECT DISTINCT 
        m.id,
        m.title,
        m.poster_path,
        m.vote_average,
        m.vote_count,
        m.release_date
       FROM movies m
       JOIN showtimes s ON m.id = s.movie_id
       JOIN rooms r ON s.room_id = r.id
       WHERE r.cinema_clusters_id = ?
       ORDER BY m.title ASC`,
      [cinemaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không có phim nào đang chiếu tại cụm rạp này" });
    }

    res.status(200).json({ success: true, movies: rows });
  } catch (error) {
    console.error("❌ Lỗi getMoviesByCinema:", error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
// backend/controllers/moviePlanController.js

export const getMoviePlanCinema = async (req, res) => {
  try {
    const { cinema_id } = req.params;

    if (!cinema_id) {
      return res.status(400).json({ success: false, message: "Thiếu cinema_id" });
    }

    // 1. Lấy TẤT CẢ kế hoạch của rạp (có phim hay chưa)
    const [planRows] = await dbPool.query(
      `SELECT 
          id AS plan_id,
          description,
          start_date,
          end_date,
          created_by,
          created_at,
          updated_at
       FROM business_plan
       WHERE cinema_id = ?
       ORDER BY created_at DESC`,
      [cinema_id]
    );

    if (!planRows.length) {
      return res.status(404).json({ success: false, message: "Không có kế hoạch nào cho cụm rạp này" });
    }

    // 2. Lấy phim (LEFT JOIN) → cho phép plan có movies = []
    const planIds = planRows.map(p => p.plan_id);
    const [movieRows] = await dbPool.query(
      `SELECT 
          bpm.plan_id,
          m.id          AS movie_id,
          m.title,
          m.poster_path,
          m.vote_average,
          m.vote_count,
          m.release_date,
          bpm.note
       FROM business_plan_movies bpm
       JOIN movies m ON bpm.movie_id = m.id
       WHERE bpm.plan_id IN (${planIds.map(() => '?').join(',')})`,
      planIds
    );

    // 3. Gom nhóm phim theo plan_id
    const movieMap = {};
    movieRows.forEach(m => {
      if (!movieMap[m.plan_id]) movieMap[m.plan_id] = [];
      movieMap[m.plan_id].push({
        movie_id: m.movie_id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
        release_date: m.release_date,
        note: m.note,
      });
    });

    // 4. Kết hợp: plan + movies (nếu có)
    const result = planRows.map(plan => ({
      plan_id: plan.plan_id,
      description: plan.description,
      start_date: plan.start_date,
      end_date: plan.end_date,
      created_by: plan.created_by,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      movies: movieMap[plan.plan_id] || [], // ← luôn có mảng, có thể rỗng
    }));

    res.status(200).json({ success: true, plans: result });
  } catch (error) {
    console.error("Lỗi getMoviePlanCinema:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
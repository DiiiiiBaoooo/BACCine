import dbPool from "../config/mysqldb.js";
import bcrypt from "bcrypt";

// 1. Thống kê nhân viên theo cụm rạp
export const getEmployees = async (req, res) => {
  const { cinema_cluster_id } = req.params;
  try {
    const [rows] = await dbPool.query(
      `SELECT e.id, e.employee_id, e.cinema_cluster_id, e.start_date, e.end_date, e.position,
      u.email as email,
              u.name AS employee_name, c.name AS cluster_name
       FROM employee_cinema_cluster e
       JOIN users u ON u.id = e.employee_id
       JOIN cinema_clusters c ON c.id = e.cinema_cluster_id
       WHERE e.cinema_cluster_id = ?`,
      [cinema_cluster_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees", error: err.message });
  }
};

// 2. Thêm nhân viên vào cluster

// Manager thêm nhân viên mới
export const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      province_code,
      district_code,
      cinema_cluster_id,
      position,
      start_date,
      end_date
    } = req.body;

    // Check input
    if (!fullName || !email || !phone || !cinema_cluster_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    // Check email tồn tại chưa
    const [existRows] = await dbPool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existRows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Avatar ngẫu nhiên
    const seed = Math.random().toString(36).substring(2, 10);
    const randomAvatar = `https://robohash.org/${seed}.png`;

    // Mật khẩu mặc định = "123456"
    const defaultPassword = await bcrypt.hash("123456", 10);

    // 1. Tạo user role = employee
    const [userResult] = await dbPool.query(
      `INSERT INTO users 
         (name, email, password, phone, province_code, district_code, role, profilePicture) 
       VALUES (?, ?, ?, ?, ?, ?, 'employee', ?)`,
      [fullName, email, defaultPassword, phone, province_code, district_code, randomAvatar]
    );

    const employeeId = userResult.insertId;

    // 2. Gắn vào cụm rạp
    const [empClusterResult] = await dbPool.query(
      `INSERT INTO employee_cinema_cluster 
         (employee_id, cinema_cluster_id, start_date, end_date, position)
       VALUES (?, ?, ?, ?, ?)`,
      [employeeId, cinema_cluster_id, start_date || null, end_date || null, position || "Staff"]
    );

    
    res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công",
      employee: {
        id: employeeId,
        name: fullName,
        email,
        phone,
        role: "employee",
        position: position || "Staff",
        start_date: start_date || null,
        end_date: end_date || null,
        cinema_cluster_id,
        profilePicture: randomAvatar,
        employee_cluster_id: empClusterResult.insertId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Thống kê nhân viên chi tiết
export const getEmployeeStatistics = async (req, res) => {
    const { cinema_cluster_id, position, status } = req.query;
    try {
      let query = `
        SELECT 
          e.cinema_cluster_id,
          c.name AS cluster_name,
          e.position,
          COUNT(*) AS total_employees,
          SUM(CASE WHEN e.end_date IS NULL THEN 1 ELSE 0 END) AS active_employees,
          SUM(CASE WHEN e.end_date IS NOT NULL THEN 1 ELSE 0 END) AS inactive_employees,
          GROUP_CONCAT(
            CONCAT(u.name, ' (', e.position, ', ', 
                   IFNULL(e.start_date, 'N/A'), ' - ', 
                   IFNULL(e.end_date, 'Đang làm việc'), ')'
            )
          ) AS employee_details
        FROM employee_cinema_cluster e
        JOIN users u ON u.id = e.employee_id
        JOIN cinema_clusters c ON c.id = e.cinema_cluster_id
      `;
      
      const params = [];
      const conditions = [];
  
      if (cinema_cluster_id) {
        conditions.push('e.cinema_cluster_id = ?');
        params.push(cinema_cluster_id);
      }
  
      if (position) {
        conditions.push('e.position = ?');
        params.push(position);
      }
  
      if (status === 'active') {
        conditions.push('e.end_date IS NULL');
      } else if (status === 'inactive') {
        conditions.push('e.end_date IS NOT NULL');
      }
  
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
  
      query += ' GROUP BY e.cinema_cluster_id, c.name, e.position';
  
      const [rows] = await dbPool.query(query, params);
  
      res.json({
        success: true,
        data: rows,
        summary: {
          total_clusters: rows.length,
          total_employees: rows.reduce((sum, row) => sum + Number(row.total_employees), 0),
          total_active: rows.reduce((sum, row) => sum + Number(row.active_employees), 0),
          total_inactive: rows.reduce((sum, row) => sum + Number(row.inactive_employees), 0),
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching employee statistics", error: err.message });
    }
  };

// 3. Cập nhật quyền (position)
export const updateEmployeeRole = async (req, res) => {
  const { id } = req.params;
  const { position, end_date } = req.body;
  try {
    await dbPool.query(
      `UPDATE employee_cinema_cluster SET position = ?, end_date = ? WHERE id = ?`,
      [position, end_date || null, id]
    );
    res.json({ message: "Employee role updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating role", error: err.message });
  }
};

// 4. Xóa nhân viên khỏi cluster
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query(`DELETE FROM employee_cinema_cluster WHERE id = ?`, [id]);
    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting employee", error: err.message });
  }
};


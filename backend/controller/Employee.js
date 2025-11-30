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

export const getEmployeeOnline = async (req,res)=>{
  try {
    const [rows] = await dbPool.query(`
      SELECT 
        e.id, 
        e.employee_id
      FROM 
        employee_cinema_cluster e
      JOIN 
        users u ON u.id = e.employee_id
      WHERE 
        u.isOnline = 1
    `);
    
    if (rows.length === 0) {
      return res.status(200).json({ employees: [], message: "Không có nhân viên nào đang online" });
    }

    res.status(200).json({
      employees: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhân viên online:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
}
export const getEmployeeDashboard = async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    const employee_id = req.user.id;
    
    if (!employee_id || isNaN(employee_id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID nhân viên không hợp lệ" 
      });
    }

    // Kiểm tra nhân viên tồn tại
    const [employeeCheck] = await connection.query(
      'SELECT id, role FROM users WHERE id = ? AND role = "employee"',
      [employee_id]
    );

    if (employeeCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Nhân viên không tồn tại" 
      });
    }

    // ========== PHẦN 1: THỐNG KÊ ĐỔN HÀNG ==========
    const [ordersStats] = await connection.query(`
      SELECT 
        COUNT(CASE WHEN DATE(order_date) = CURDATE() THEN 1 END) as total_orders_today,
        COUNT(CASE WHEN YEARWEEK(order_date, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as total_orders_this_week,
        COUNT(CASE WHEN YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE()) THEN 1 END) as total_orders_this_month
      FROM orders
      WHERE employee_id = ? AND status = 'confirmed'
    `, [employee_id]);

    // ========== PHẦN 2: THỐNG KÊ VÉ ==========
    const [ticketsStats] = await connection.query(`
      SELECT 
        COUNT(CASE WHEN DATE(o.order_date) = CURDATE() THEN 1 END) as total_tickets_today,
        COUNT(CASE WHEN YEARWEEK(o.order_date, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as total_tickets_this_week,
        COUNT(CASE WHEN YEAR(o.order_date) = YEAR(CURDATE()) AND MONTH(o.order_date) = MONTH(CURDATE()) THEN 1 END) as total_tickets_this_month
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      WHERE o.employee_id = ? AND o.status = 'confirmed'
    `, [employee_id]);

    // ========== PHẦN 3: THỐNG KÊ DOANH THU ==========
    const [revenueStats] = await connection.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(order_date) = CURDATE() THEN total_amount ELSE 0 END), 0) as total_revenue_today,
        COALESCE(SUM(CASE WHEN YEARWEEK(order_date, 1) = YEARWEEK(CURDATE(), 1) THEN total_amount ELSE 0 END), 0) as total_revenue_this_week,
        COALESCE(SUM(CASE WHEN YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE()) THEN total_amount ELSE 0 END), 0) as total_revenue_this_month
      FROM orders
      WHERE employee_id = ? AND status = 'confirmed'
    `, [employee_id]);

    // ========== PHẦN 4: THỐNG KÊ CA LÀM VIỆC ==========
    const [shiftsStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_shifts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_shifts,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_shifts,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_shifts,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_shifts
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE ecc.employee_id = ?
    `, [employee_id]);

    // ========== PHẦN 5: BIỂU ĐỒ DOANH THU 7 NGÀY - FIX ==========
    const [revenueChart] = await connection.query(`
      SELECT 
        d.date,
        COUNT(o.order_id) as orders,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM (
        SELECT DATE(order_date) as date
        FROM orders
        WHERE employee_id = ? 
          AND status = 'confirmed'
          AND order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(order_date)
      ) d
      LEFT JOIN orders o ON DATE(o.order_date) = d.date 
        AND o.employee_id = ? 
        AND o.status = 'confirmed'
      GROUP BY d.date
      ORDER BY d.date ASC
    `, [employee_id, employee_id]);

    // ========== PHẦN 6: BIỂU ĐỒ VÉ THEO TUẦN - FIX ==========
    const [ticketsWeeklyChart] = await connection.query(`
      SELECT 
        w.week_num,
        COUNT(ot.order_ticket_id) as total_tickets
      FROM (
        SELECT DISTINCT WEEK(order_date, 1) as week_num
        FROM orders
        WHERE employee_id = ?
          AND status = 'confirmed'
          AND order_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
      ) w
      LEFT JOIN orders o ON WEEK(o.order_date, 1) = w.week_num
        AND o.employee_id = ?
        AND o.status = 'confirmed'
        AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
      LEFT JOIN orderticket ot ON ot.order_id = o.order_id
      GROUP BY w.week_num
      ORDER BY w.week_num ASC
    `, [employee_id, employee_id]);

    // ========== PHẦN 7: TOP 5 PHIM BÁN CHẠY ==========
    const [topMovies] = await connection.query(`
      SELECT 
        m.id,
        m.title,
        m.poster_path,
        COUNT(ot.order_ticket_id) as tickets_sold,
        COALESCE(SUM(ot.ticket_price), 0) as revenue
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      JOIN showtimes s ON ot.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE o.employee_id = ? 
        AND o.status = 'confirmed'
        AND YEAR(o.order_date) = YEAR(CURDATE())
        AND MONTH(o.order_date) = MONTH(CURDATE())
      GROUP BY m.id, m.title, m.poster_path
      ORDER BY tickets_sold DESC
      LIMIT 5
    `, [employee_id]);

    // ========== PHẦN 8: CA LÀM VIỆC SẮP TỚI ==========
    const [upcomingShifts] = await connection.query(`
      SELECT 
        s.shift_date,
        s.shift_type,
        s.start_time,
        s.end_time,
        s.status,
        cc.name as cinema_name
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      JOIN cinema_clusters cc ON ecc.cinema_cluster_id = cc.id
      WHERE ecc.employee_id = ?
        AND s.shift_date >= CURDATE()
        AND s.status IN ('pending', 'confirmed')
      ORDER BY s.shift_date ASC, s.start_time ASC
      LIMIT 5
    `, [employee_id]);

    // ========== TÍNH TỶ LỆ HOÀN THÀNH CA ==========
    const shifts = shiftsStats[0];
    const completion_rate = shifts.total_shifts > 0 
      ? ((shifts.completed_shifts / shifts.total_shifts) * 100).toFixed(2)
      : 0;

    // ========== TRẢ VỀ KẾT QUẢ ==========
    return res.status(200).json({
      success: true,
      message: "Lấy thống kê dashboard thành công",
      data: {
        summary: {
          orders: {
            today: ordersStats[0].total_orders_today,
            this_week: ordersStats[0].total_orders_this_week,
            this_month: ordersStats[0].total_orders_this_month
          },
          tickets: {
            today: ticketsStats[0].total_tickets_today,
            this_week: ticketsStats[0].total_tickets_this_week,
            this_month: ticketsStats[0].total_tickets_this_month
          },
          revenue: {
            today: parseFloat(revenueStats[0].total_revenue_today),
            this_week: parseFloat(revenueStats[0].total_revenue_this_week),
            this_month: parseFloat(revenueStats[0].total_revenue_this_month)
          },
          shifts: {
            total: shifts.total_shifts,
            completed: shifts.completed_shifts,
            confirmed: shifts.confirmed_shifts,
            pending: shifts.pending_shifts,
            cancelled: shifts.cancelled_shifts,
            completion_rate: parseFloat(completion_rate)
          }
        },
        charts: {
          revenue_7_days: revenueChart.map(item => ({
            date: item.date,
            orders: item.orders,
            revenue: parseFloat(item.revenue)
          })),
          tickets_weekly: ticketsWeeklyChart.map(item => ({
            week: `Tuần ${item.week_num}`,
            tickets: item.total_tickets
          }))
        },
        top_movies: topMovies.map(movie => ({
          title: movie.title,
          poster_path: movie.poster_path,
          tickets_sold: movie.tickets_sold,
          revenue: parseFloat(movie.revenue)
        })),
        upcoming_shifts: upcomingShifts.map(shift => ({
          date: shift.shift_date,
          type: shift.shift_type,
          start_time: shift.start_time,
          end_time: shift.end_time,
          status: shift.status,
          cinema: shift.cinema_name
        }))
      }
    });

  } catch (error) {
    console.error('Error getting employee dashboard:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Lỗi server: ${error.message}` 
    });
  } finally {
    connection.release();
  }
};
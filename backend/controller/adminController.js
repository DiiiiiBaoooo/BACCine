// backend/controllers/adminController.js
import connection from "../config/mysqldb.js";

// GET tổng quan stats (BỔ SUNG ticketsToday + totalTicketsSold)
export const getAdminStats = async (req, res) => {
  try {
    // 1. Tổng số rạp
    const [cinemas] = await connection.query('SELECT COUNT(*) as total FROM cinema_clusters');

    // 2. Phim đang chiếu
    const [movies] = await connection.query(`
      SELECT COUNT(DISTINCT movie_id) as total 
      FROM showtimes 
      WHERE status IN ('Ongoing', 'Scheduled')
    `);

    // 3. Tổng suất chiếu
    const [showtimes] = await connection.query('SELECT COUNT(*) as total FROM showtimes');

    // 4. Nhân viên đang làm việc
    const [employees] = await connection.query(`
      SELECT COUNT(DISTINCT employee_id) as total 
      FROM employee_cinema_cluster 
      WHERE end_date IS NULL
    `);

    // 5. Thành viên
    const [members] = await connection.query('SELECT COUNT(*) as total FROM membership_cards');

    // 6. Tổng doanh thu
    const [revenue] = await connection.query(`
      SELECT SUM(total_amount) as total 
      FROM orders 
      WHERE status = 'confirmed'
    `);

    // 7. Vé bán hôm nay
    const [ticketsToday] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      WHERE o.status = 'confirmed'
        AND DATE(o.order_date) = CURDATE()
    `);

    // 8. Tổng số vé đã bán (tất cả thời gian)
    const [totalTicketsSold] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      WHERE o.status = 'confirmed'
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalCinemas: cinemas[0].total,
        moviesPlaying: movies[0].total,
        totalShowtimes: showtimes[0].total,
        totalEmployees: employees[0].total,
        totalMembers: members[0].total,
        totalRevenue: revenue[0].total || 0,
        ticketsToday: ticketsToday[0].total,
        totalTicketsSold: totalTicketsSold[0].total,
      }
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET doanh thu theo tháng (6 tháng gần nhất)
export const getMonthlyRevenue = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'confirmed'
        AND order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    const data = rows.map(row => ({
      month: row.month,
      revenue: row.revenue || 0
    }));

    res.status(200).json({ success: true, revenueData: data });
  } catch (error) {
    console.error('Error in getMonthlyRevenue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET top 3 phim doanh thu cao
export const getTopMovies = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        m.title as name,
        SUM(o.total_amount) as revenue
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE o.status = 'confirmed'
      GROUP BY m.id
      ORDER BY revenue DESC
      LIMIT 3
    `);

    res.status(200).json({ success: true, topMovies: rows });
  } catch (error) {
    console.error('Error in getTopMovies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
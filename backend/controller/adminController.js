// backend/controllers/adminController.js
import connection from "../config/mysqldb.js";

// GET tổng quan stats
export const getAdminStats = async (req, res) => {
  try {
    // 1. Tổng số rạp
    const [cinemas] = await connection.query('SELECT COUNT(*) as total FROM cinema_clusters WHERE status = "active"');

    // 2. Tổng phim đã chiếu (unique movies trong showtimes)
    const [movies] = await connection.query(`
      SELECT COUNT(DISTINCT movie_id) as total 
      FROM showtimes
    `);

    // 3. Tổng suất chiếu
    const [showtimes] = await connection.query('SELECT COUNT(*) as total FROM showtimes');

    // 4. Tổng doanh thu
    const [revenue] = await connection.query(`
      SELECT SUM(total_amount) as total 
      FROM orders 
      WHERE status = 'confirmed'
    `);

    // 5. Tổng nhân viên
    const [employees] = await connection.query(`
      SELECT COUNT(DISTINCT employee_id) as total 
      FROM employee_cinema_cluster 
      WHERE end_date IS NULL
    `);

    // 6. Tổng ghế đã bán
    const [seatsSold] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM show_seats 
      WHERE status = 'booked'
    `);

    // 7. Tổng ghế
    const [totalSeats] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM show_seats
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalCinemas: cinemas[0].total,
        totalMovies: movies[0].total,
        totalShowtimes: showtimes[0].total,
        totalRevenue: revenue[0].total || 0,
        totalEmployees: employees[0].total,
        seatsSold: seatsSold[0].total,
        totalSeats: totalSeats[0].total,
        occupancyRate: totalSeats[0].total > 0 
          ? ((seatsSold[0].total / totalSeats[0].total) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET doanh thu theo rạp
export const getRevenueByCinema = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        cc.name as cinema_name,
        SUM(o.total_amount) as revenue,
        COUNT(DISTINCT o.order_id) as total_orders
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      JOIN cinema_clusters cc ON r.cinema_clusters_id = cc.id
      WHERE o.status = 'confirmed'
      GROUP BY cc.id
      ORDER BY revenue DESC
    `);

    res.status(200).json({ 
      success: true, 
      data: rows.map(row => ({
        cinema_name: row.cinema_name,
        revenue: parseFloat(row.revenue) || 0,
        total_orders: row.total_orders
      }))
    });
  } catch (error) {
    console.error('Error in getRevenueByCinema:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET doanh thu theo tháng (12 tháng gần nhất)
export const getMonthlyRevenue = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'confirmed'
        AND order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    res.status(200).json({ 
      success: true, 
      data: rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue) || 0
      }))
    });
  } catch (error) {
    console.error('Error in getMonthlyRevenue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET suất chiếu theo phim
export const getShowtimesByMovie = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        m.title as movie_title,
        COUNT(s.id) as total_showtimes,
        SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed_showtimes
      FROM movies m
      LEFT JOIN showtimes s ON m.id = s.movie_id
      GROUP BY m.id
      HAVING total_showtimes > 0
      ORDER BY total_showtimes DESC
      LIMIT 10
    `);

    res.status(200).json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('Error in getShowtimesByMovie:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET suất chiếu theo rạp
export const getShowtimesByCinema = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        cc.name as cinema_name,
        COUNT(s.id) as total_showtimes,
        SUM(CASE WHEN s.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN s.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN s.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM cinema_clusters cc
      LEFT JOIN rooms r ON cc.id = r.cinema_clusters_id
      LEFT JOIN showtimes s ON r.id = s.room_id
      GROUP BY cc.id
      ORDER BY total_showtimes DESC
    `);

    res.status(200).json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('Error in getShowtimesByCinema:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET tỷ lệ lấp đầy ghế theo rạp
export const getOccupancyByCinema = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        cc.name as cinema_name,
        COUNT(ss.seat_id) as total_seats,
        SUM(CASE WHEN ss.status = 'booked' THEN 1 ELSE 0 END) as booked_seats,
        ROUND((SUM(CASE WHEN ss.status = 'booked' THEN 1 ELSE 0 END) / COUNT(ss.seat_id)) * 100, 2) as occupancy_rate
      FROM cinema_clusters cc
      LEFT JOIN rooms r ON cc.id = r.cinema_clusters_id
      LEFT JOIN showtimes st ON r.id = st.room_id
      LEFT JOIN show_seats ss ON st.id = ss.showtime_id
      WHERE ss.seat_id IS NOT NULL
      GROUP BY cc.id
      ORDER BY occupancy_rate DESC
    `);

    res.status(200).json({ 
      success: true, 
      data: rows.map(row => ({
        cinema_name: row.cinema_name,
        total_seats: row.total_seats,
        booked_seats: row.booked_seats,
        occupancy_rate: parseFloat(row.occupancy_rate) || 0
      }))
    });
  } catch (error) {
    console.error('Error in getOccupancyByCinema:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET top phim theo doanh thu
export const getTopMovies = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        m.title as movie_title,
        m.poster_path,
        SUM(o.total_amount) as revenue,
        COUNT(DISTINCT o.order_id) as total_orders
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE o.status = 'confirmed'
      GROUP BY m.id
      ORDER BY revenue DESC
      LIMIT 5
    `);

    res.status(200).json({ 
      success: true, 
      data: rows.map(row => ({
        movie_title: row.movie_title,
        poster_path: row.poster_path,
        revenue: parseFloat(row.revenue) || 0,
        total_orders: row.total_orders
      }))
    });
  } catch (error) {
    console.error('Error in getTopMovies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
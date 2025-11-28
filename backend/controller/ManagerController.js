import connection from "../config/mysqldb.js";

export const getManagerDashboard = async (req, res) => {
  const { cinemaId } = req.query;
  if (!cinemaId) return res.status(400).json({ success: false, message: "cinemaId is required" });

  try {
    // 1. Thông tin rạp
    const [cinemaInfo] = await connection.query(
      `SELECT name, rooms FROM cinema_clusters WHERE id = ?`, [cinemaId]
    );
    if (!cinemaInfo.length) return res.status(404).json({ success: false, message: "Cinema not found" });

    const cinema = cinemaInfo[0];

    // 2. Nhân viên đang làm việc tại rạp
    const [employees] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM employee_cinema_cluster 
      WHERE cinema_cluster_id = ? AND end_date IS NULL
    `, [cinemaId]);

    // 3. Tổng phim đã chiếu (từ trước đến nay)
    const [totalMoviesScreened] = await connection.query(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN movies m ON s.movie_id = m.id
      WHERE r.cinema_clusters_id = ?
    `, [cinemaId]);

    // 4. Tổng suất chiếu (từ trước đến nay)
    const [totalShowtimes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ?
    `, [cinemaId]);

    // 5. Tổng doanh thu (từ trước đến nay)
    const [totalRevenue] = await connection.query(`
      SELECT SUM(o.total_amount) as total
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? AND o.status = 'confirmed'
    `, [cinemaId]);

    // 6. Doanh thu hôm nay
    const [revenueToday] = await connection.query(`
      SELECT SUM(o.total_amount) as total
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND DATE(o.order_date) = CURDATE()
    `, [cinemaId]);

    // 7. Doanh thu theo tháng (12 tháng gần nhất)
    const [revenueByMonth] = await connection.query(`
      SELECT 
        DATE_FORMAT(o.order_date, '%Y-%m') as month,
        SUM(o.total_amount) as revenue,
        COUNT(DISTINCT o.order_id) as order_count
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
      ORDER BY month ASC
    `, [cinemaId]);

    // 8. Tổng suất chiếu theo phim (top 10 phim có nhiều suất nhất)
    const [showtimesByMovie] = await connection.query(`
      SELECT 
        m.id,
        m.title,
        m.poster_path,
        COUNT(s.id) as showtime_count,
        SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed_count
      FROM movies m
      JOIN showtimes s ON m.id = s.movie_id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ?
      GROUP BY m.id, m.title, m.poster_path
      ORDER BY showtime_count DESC
      LIMIT 10
    `, [cinemaId]);

    // 9. Tỷ lệ lấp đầy ghế theo phim (top 10 phim)
    const [occupancyByMovie] = await connection.query(`
      SELECT 
        m.id,
        m.title,
        COUNT(DISTINCT s.id) as total_showtimes,
        COUNT(ot.order_ticket_id ) as tickets_sold,
        SUM(r.capacity) as total_capacity,
        ROUND((COUNT(ot.order_ticket_id ) / SUM(r.capacity)) * 100, 2) as occupancy_rate
      FROM movies m
      JOIN showtimes s ON m.id = s.movie_id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN orderticket ot ON s.id = ot.showtime_id
      LEFT JOIN orders o ON ot.order_id = o.order_id AND o.status = 'confirmed'
      WHERE r.cinema_clusters_id = ?
        AND s.status IN ('Completed', 'Ongoing')
      GROUP BY m.id, m.title
      HAVING total_showtimes > 0
      ORDER BY occupancy_rate DESC
      LIMIT 10
    `, [cinemaId]);

    // 10. Tỷ lệ lấp đầy ghế theo khung giờ chiếu
    const [occupancyByTimeSlot] = await connection.query(`
      SELECT 
        CASE 
          WHEN HOUR(s.start_time) BETWEEN 6 AND 11 THEN 'Sáng (6h-11h)'
          WHEN HOUR(s.start_time) BETWEEN 12 AND 17 THEN 'Chiều (12h-17h)'
          WHEN HOUR(s.start_time) BETWEEN 18 AND 21 THEN 'Tối (18h-21h)'
          ELSE 'Khuya (22h-5h)'
        END as time_slot,
        COUNT(DISTINCT s.id) as total_showtimes,
        COUNT(ot.order_ticket_id ) as tickets_sold,
        SUM(r.capacity) as total_capacity,
        ROUND((COUNT(ot.order_ticket_id ) / SUM(r.capacity)) * 100, 2) as occupancy_rate
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN orderticket ot ON s.id = ot.showtime_id
      LEFT JOIN orders o ON ot.order_id = o.order_id AND o.status = 'confirmed'
      WHERE r.cinema_clusters_id = ?
        AND s.status IN ('Completed', 'Ongoing')
      GROUP BY time_slot
      ORDER BY 
        CASE time_slot
          WHEN 'Sáng (6h-11h)' THEN 1
          WHEN 'Chiều (12h-17h)' THEN 2
          WHEN 'Tối (18h-21h)' THEN 3
          ELSE 4
        END
    `, [cinemaId]);

    // 11. Doanh thu theo phim (top 10)
    const [revenueByMovie] = await connection.query(`
      SELECT 
        m.id,
        m.title,
        m.poster_path,
        SUM(o.total_amount) as revenue,
        COUNT(DISTINCT o.order_id) as order_count,
        COUNT(ot.order_ticket_id ) as tickets_sold
      FROM movies m
      JOIN showtimes s ON m.id = s.movie_id
      JOIN rooms r ON s.room_id = r.id
      JOIN orderticket ot ON s.id = ot.showtime_id
      JOIN orders o ON ot.order_id = o.order_id
      WHERE r.cinema_clusters_id = ? AND o.status = 'confirmed'
      GROUP BY m.id, m.title, m.poster_path
      ORDER BY revenue DESC
      LIMIT 10
    `, [cinemaId]);

    // 12. Thống kê vé theo tuần (4 tuần gần nhất)
    const [ticketsByWeek] = await connection.query(`
      SELECT 
        YEARWEEK(o.order_date, 1) as week_number,
        DATE_FORMAT(MIN(o.order_date), '%d/%m') as week_start,
        DATE_FORMAT(MAX(o.order_date), '%d/%m') as week_end,
        COUNT(ot.order_ticket_id ) as tickets_sold,
        SUM(o.total_amount) as revenue
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      JOIN orderticket ot ON o.order_id = ot.order_id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
      GROUP BY YEARWEEK(o.order_date, 1)
      ORDER BY week_number ASC
    `, [cinemaId]);

    res.status(200).json({
      success: true,
      data: {
        cinema: { 
          name: cinema.name, 
          rooms: cinema.rooms 
        },
        summary: {
          totalEmployees: employees[0].total,
          totalMoviesScreened: totalMoviesScreened[0].total,
          totalShowtimes: totalShowtimes[0].total,
          totalRevenue: totalRevenue[0].total || 0,
          revenueToday: revenueToday[0].total || 0,
        },
        charts: {
          revenueByMonth: revenueByMonth.map(r => ({
            month: r.month,
            revenue: r.revenue || 0,
            orderCount: r.order_count || 0
          })),
          showtimesByMovie: showtimesByMovie.map(m => ({
            movieId: m.id,
            title: m.title,
            posterUrl: m.poster_path,
            showtimeCount: m.showtime_count,
            completedCount: m.completed_count
          })),
          occupancyByMovie: occupancyByMovie.map(m => ({
            movieId: m.id,
            title: m.title,
            totalShowtimes: m.total_showtimes,
            ticketsSold: m.tickets_sold,
            totalCapacity: m.total_capacity,
            occupancyRate: parseFloat(m.occupancy_rate) || 0
          })),
          occupancyByTimeSlot: occupancyByTimeSlot.map(t => ({
            timeSlot: t.time_slot,
            totalShowtimes: t.total_showtimes,
            ticketsSold: t.tickets_sold,
            totalCapacity: t.total_capacity,
            occupancyRate: parseFloat(t.occupancy_rate) || 0
          })),
          revenueByMovie: revenueByMovie.map(m => ({
            movieId: m.id,
            title: m.title,
            posterUrl: m.poster_path,
            revenue: m.revenue || 0,
            orderCount: m.order_count || 0,
            ticketsSold: m.tickets_sold || 0
          })),
          ticketsByWeek: ticketsByWeek.map(w => ({
            weekNumber: w.week_number,
            weekLabel: `${w.week_start} - ${w.week_end}`,
            ticketsSold: w.tickets_sold || 0,
            revenue: w.revenue || 0
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error in getManagerDashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
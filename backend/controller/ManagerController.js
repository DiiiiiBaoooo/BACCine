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

    // 3. Phim đang chiếu tại rạp
    const [moviesPlaying] = await connection.query(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN movies m ON s.movie_id = m.id
      WHERE r.cinema_clusters_id = ? 
        AND s.status IN ('Scheduled', 'Ongoing')
    `, [cinemaId]);

    // 4. Tổng suất chiếu
    const [totalShowtimes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ?
    `, [cinemaId]);

    // 5. Suất chiếu hôm nay
    const [showtimesToday] = await connection.query(`
      SELECT COUNT(*) as total
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND DATE(s.start_time) = CURDATE()
    `, [cinemaId]);

    // 6. Tổng vé đã bán (tất cả)
    const [totalTickets] = await connection.query(`
      SELECT COUNT(*) as total
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      JOIN showtimes s ON ot.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? AND o.status = 'confirmed'
    `, [cinemaId]);

    // 7. Vé bán hôm nay
    const [ticketsToday] = await connection.query(`
      SELECT COUNT(*) as total
      FROM orderticket ot
      JOIN orders o ON ot.order_id = o.order_id
      JOIN showtimes s ON ot.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND DATE(o.order_date) = CURDATE()
    `, [cinemaId]);

    // 8. Doanh thu hôm nay
    const [revenueToday] = await connection.query(`
      SELECT SUM(o.total_amount) as total
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND DATE(o.order_date) = CURDATE()
    `, [cinemaId]);

    // 9. Doanh thu tháng hiện tại
    const [revenueThisMonth] = await connection.query(`
      SELECT SUM(o.total_amount) as total
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND MONTH(o.order_date) = MONTH(CURDATE())
        AND YEAR(o.order_date) = YEAR(CURDATE())
    `, [cinemaId]);

    // 10. Doanh thu 7 ngày gần nhất
    const [revenue7Days] = await connection.query(`
      SELECT 
        DATE(o.order_date) as date,
        SUM(o.total_amount) as revenue
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ? 
        AND o.status = 'confirmed'
        AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(o.order_date)
      ORDER BY date ASC
    `, [cinemaId]);

    res.status(200).json({
      success: true,
      data: {
        cinema: { name: cinema.name, rooms: cinema.rooms },
        stats: {
          employees: employees[0].total,
          moviesPlaying: moviesPlaying[0].total,
          totalShowtimes: totalShowtimes[0].total,
          showtimesToday: showtimesToday[0].total,
          totalTickets: totalTickets[0].total,
          ticketsToday: ticketsToday[0].total,
          revenueToday: revenueToday[0].total || 0,
          revenueThisMonth: revenueThisMonth[0].total || 0,
        },
        revenue7Days: revenue7Days.map(r => ({
          date: r.date,
          revenue: r.revenue || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error in getManagerDashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
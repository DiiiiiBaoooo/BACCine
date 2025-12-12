import dbPool from "../config/mysqldb.js";

// Helper function: Convert datetime-local to MySQL format (UTC+7)
const formatToMySQLDateTime = (datetimeLocal) => {
  // datetimeLocal format: "YYYY-MM-DDTHH:mm" hoặc "YYYY-MM-DD HH:mm:ss"
  const date = new Date(datetimeLocal);
  
  // Format thành YYYY-MM-DD HH:mm:ss cho MySQL
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Lấy lịch chiếu sắp diễn ra tại 1 rạp
export const getShowTimeOnCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    const [rows] = await dbPool.query(
      `SELECT s.*, m.title, r.name as room_name
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN rooms r ON s.room_id = r.id
       WHERE r.cinema_clusters_id = ?
       ORDER BY s.start_time DESC`,
      [cinemaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không có lịch chiếu nào" });
    }

    res.status(200).json({ success: true, showtimes: rows });
  } catch (error) {
    console.error("❌ Lỗi getShowTimeOnCinema:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thêm lịch chiếu mới
export const createShowTime = async (req, res) => {
  try {
    const showtimes = Array.isArray(req.body) ? req.body : [req.body];
    const insertedIds = [];

    for (const { movie_id, room_id, start_time, end_time } of showtimes) {
      if (!movie_id || !room_id || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc cho một suất chiếu" });
      }

      // ✅ Format lại start_time và end_time
      const formattedStartTime = formatToMySQLDateTime(start_time);
      const formattedEndTime = formatToMySQLDateTime(end_time);

      // Check for conflicting showtimes in the same room
      const [exist] = await dbPool.query(
        `SELECT * FROM showtimes 
         WHERE room_id = ?
           AND (
             (start_time <= ? AND end_time > ?) OR
             (start_time < ? AND end_time >= ?)
           )`,
        [room_id, formattedStartTime, formattedStartTime, formattedEndTime, formattedEndTime]
      );

      if (exist.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: `Phòng đã có suất chiếu trong khoảng thời gian ${formattedStartTime}` });
      }

      // Insert the showtime
      const [result] = await dbPool.query(
        `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, status) 
         VALUES (?, ?, ?, ?, 'Scheduled')`,
        [movie_id, room_id, formattedStartTime, formattedEndTime]
      );

      const showtimeId = result.insertId;
      insertedIds.push(showtimeId);

      // Generate seat entries for rows A-H (1-9) and I-J (1-4) with specific seat_type_id
      const seatEntries = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

      for (const row of rows) {
        const maxSeats = row <= 'H' ? 9 : 4;
        const seatTypeId = row === 'A' || row === 'B' ? 1 : row === 'I' || row === 'J' ? 3 : 2;

        for (let seatNum = 1; seatNum <= maxSeats; seatNum++) {
          seatEntries.push([
            showtimeId,
            `${row}${seatNum}`,
            'available',
            seatTypeId
          ]);
        }
      }

      if (seatEntries.length > 0) {
        await dbPool.query(
          `INSERT INTO show_seats (showtime_id, seat_number, status, seat_type_id)
           VALUES ?`,
          [seatEntries]
        );
      }
    }

    res.status(201).json({ success: true, ids: insertedIds, message: "Thêm lịch chiếu và ghế thành công" });
  } catch (error) {
    console.error("❌ Lỗi createShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật lịch chiếu
export const updateShowTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;

    // Kiểm tra lịch chiếu còn cách ít nhất 1 ngày
    const [rows] = await dbPool.query(
      `SELECT * FROM showtimes WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch chiếu" });
    }

    const showtime = rows[0];
    const now = new Date();
    const start = new Date(showtime.start_time);

    if ((start - now) / (1000 * 60 * 60 * 24) < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Chỉ được sửa lịch chiếu trước ít nhất 1 ngày" });
    }

    // ✅ Format lại start_time và end_time
    const formattedStartTime = formatToMySQLDateTime(start_time);
    const formattedEndTime = formatToMySQLDateTime(end_time);

    await dbPool.query(
      `UPDATE showtimes 
       SET start_time = ?, end_time = ?, status = ?
       WHERE id = ?`,
      [formattedStartTime, formattedEndTime, status, id]
    );

    res.status(200).json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("❌ Lỗi updateShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa lịch chiếu
export const deleteShowTime = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await dbPool.query(
      `SELECT * FROM showtimes WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch chiếu" });
    }

    const showtime = rows[0];
    const now = new Date();
    const start = new Date(showtime.start_time);

    if (start <= now) {
      return res
        .status(400)
        .json({ success: false, message: "Không thể xóa lịch chiếu đã hoặc đang diễn ra" });
    }

    await dbPool.query(`DELETE FROM showtimes WHERE id = ?`, [id]);

    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    console.error("❌ Lỗi deleteShowtime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Các function khác giữ nguyên...
export const getAllShow = async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT DISTINCT 
         s.movie_id,
         m.title,
         m.poster_path,
         m.vote_average,
         m.vote_count,
         m.release_date,
         m.runtime,
         GROUP_CONCAT(DISTINCT g.name) AS genres,
         GROUP_CONCAT(DISTINCT a.name) AS actors
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       LEFT JOIN movie_genres mg ON m.id = mg.movie_id
       LEFT JOIN genres g ON mg.genre_id = g.id
       LEFT JOIN movie_casts mc ON m.id = mc.movie_id
       LEFT JOIN actors a ON mc.actor_id = a.id
       WHERE s.status IN ('Ongoing', 'Scheduled')
       GROUP BY s.movie_id, m.title, m.poster_path, m.vote_average, m.vote_count, m.release_date, m.runtime
       ORDER BY m.title ASC`
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không có phim đang chiếu" });
    }

    const formattedRows = rows.map(row => ({
      ...row,
      genres: row.genres ? row.genres.split(',') : [],
      actors: row.actors ? row.actors.split(',') : []
    }));

    res.status(200).json({ success: true, showtimes: formattedRows });
  } catch (error) {
    console.error("❌ Lỗi getAllShow:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getShow = async (req, res) => {
  try {
    const { movie_id } = req.params;

    const [movieRows] = await dbPool.query(
      `SELECT DISTINCT 
         m.id AS movie_id,
         m.title,
         m.poster_path,
         m.vote_average,
         m.vote_count,
         m.release_date,
         m.runtime,
         m.overview,
         GROUP_CONCAT(DISTINCT g.name) AS genres,
         GROUP_CONCAT(DISTINCT JSON_OBJECT('id', a.id, 'name', a.name, 'profile_path', a.profile_path)) AS actors
       FROM movies m
       LEFT JOIN movie_genres mg ON m.id = mg.movie_id
       LEFT JOIN genres g ON mg.genre_id = g.id
       LEFT JOIN movie_casts mc ON m.id = mc.movie_id
       LEFT JOIN actors a ON mc.actor_id = a.id
       WHERE m.id = ?
       GROUP BY m.id, m.title, m.poster_path, m.vote_average, m.vote_count, m.release_date, m.runtime, m.overview`,
      [movie_id]
    );

    if (movieRows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phim" });
    }

    const [reviewStats] = await dbPool.query(`
      SELECT 
        COALESCE(AVG(rating), 0) AS average_rating,
        COUNT(*) AS review_count
      FROM movie_reviews 
      WHERE movie_id = ?
    `, [movie_id]);

    const [reviews] = await dbPool.query(`
      SELECT 
        mr.review_id, mr.rating, mr.comment, mr.created_at, mr.is_verified_viewer,
        u.name AS user_name
      FROM movie_reviews mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.movie_id = ?
      ORDER BY mr.rating DESC, mr.created_at DESC
      LIMIT 10
    `, [movie_id]);

    const [showtimeRows] = await dbPool.query(
      `SELECT 
         s.*, 
         r.name AS room_name, 
         c.name AS cinema_name
       FROM showtimes s
       JOIN rooms r ON s.room_id = r.id
       JOIN cinema_clusters c ON r.cinema_clusters_id = c.id
       WHERE s.movie_id = ? 
         AND s.status IN ('Ongoing', 'Scheduled')
         AND DATE(s.start_time) >= CURDATE()
       ORDER BY s.start_time ASC`,
      [movie_id]
    );

    const [genresRows] = await dbPool.query(`
      SELECT g.name
      FROM movie_genres mg
      JOIN genres g ON mg.genre_id = g.id
      WHERE mg.movie_id = ?
    `, [movie_id]);
    
    const [actorsRows] = await dbPool.query(`
      SELECT a.id, a.name, a.profile_path
      FROM movie_casts mc
      JOIN actors a ON mc.actor_id = a.id
      WHERE mc.movie_id = ?
    `, [movie_id]);
    
    const movie = {
      ...movieRows[0],
      genres: genresRows.map(g => g.name),
      actors: actorsRows,
    };

    const dateTime = showtimeRows.map(show => ({
      id: show.id,
      room_name: show.room_name,
      cinema_name: show.cinema_name,
      start_time: show.start_time,
      end_time: show.end_time,
      status: show.status,
    }));

    res.status(200).json({
      success: true,
      movie,
      dateTime,
      average_rating: parseFloat(reviewStats[0].average_rating),
      review_count: reviewStats[0].review_count,
      reviews: reviews,
    });
  } catch (error) {
    console.error("Lỗi getShow:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getCinemaByMovie = async (req, res) => {
  try {
    const { movie_id } = req.params;

    const [rows] = await dbPool.query(
      `SELECT DISTINCT c.id AS cinema_id, c.name AS cinema_name
       FROM cinema_clusters c
       JOIN rooms r ON r.cinema_clusters_id = c.id
       JOIN showtimes s ON s.room_id = r.id
       WHERE s.movie_id = ? AND s.status IN ('Ongoing', 'Scheduled')
       ORDER BY c.name ASC`,
      [movie_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không có rạp chiếu phim nào cho phim này" });
    }

    const cinemas = rows.map(row => ({
      id: row.cinema_id,
      name: row.cinema_name,
    }));

    res.status(200).json({ success: true, cinemas });
  } catch (error) {
    console.error("❌ Lỗi getCinemaByMovie:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getAllSeatsWithStatus = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    if (!showtimeId || isNaN(showtimeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid showtimeId'
      });
    }

    const showtimeQuery = `
      SELECT st.id, st.room_id, r.name as room_name
      FROM showtimes st
      JOIN rooms r ON r.id = st.room_id
      WHERE st.id = ?
    `;

    const [showtimeRows] = await dbPool.query(showtimeQuery, [showtimeId]);

    if (showtimeRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Showtime not found'
      });
    }

    const showtime = showtimeRows[0];
    const roomId = showtime.room_id;

    const seatsQuery = `
      SELECT 
        ss.seat_id,
        ss.seat_number,
        ss.seat_type_id,
        stp.name AS seat_type_name,
        COALESCE(ss.status, 'available') AS status,
        ss.reservation_id,
        ss.expiry_time
      FROM show_seats ss
      LEFT JOIN seat_types stp ON stp.id = ss.seat_type_id
      LEFT JOIN showtimes stm ON stm.id = ss.showtime_id
      JOIN rooms r ON r.id = stm.room_id
      WHERE stm.id = ?
      ORDER BY ss.seat_number
    `;

    const [allSeats] = await dbPool.query(seatsQuery, [showtimeId]);

    const availableSeats = allSeats.filter(seat => seat.status === 'available');
    const reservedSeats = allSeats.filter(seat => seat.status === 'reserved');
    const bookedSeats = allSeats.filter(seat => seat.status === 'booked');

    const availableByType = {};
    availableSeats.forEach(seat => {
      const typeName = seat.seat_type_name || 'standard';
      if (!availableByType[typeName]) {
        availableByType[typeName] = [];
      }
      availableByType[typeName].push({
        seat_id: seat.seat_id,
        seat_number: seat.seat_number,
        seat_type_id: seat.seat_type_id
      });
    });

    return res.status(200).json({
      success: true,
      showtimeId: parseInt(showtimeId),
      roomInfo: {
        room_id: roomId,
        room_name: showtime.room_name,
        total_seats: allSeats.length
      },
      summary: {
        total: allSeats.length,
        available: availableSeats.length,
        reserved: reservedSeats.length,
        booked: bookedSeats.length
      },
      availableSeats: availableSeats.map(seat => ({
        seat_id: seat.seat_id,
        seat_number: seat.seat_number,
        seat_type_id: seat.seat_type_id,
        seat_type_name: seat.seat_type_name
      })),
      availableByType,
      occupiedSeats: [...reservedSeats, ...bookedSeats].map(seat => ({
        seat_id: seat.seat_id,
        seat_number: seat.seat_number,
        status: seat.status,
        seat_type_id: seat.seat_type_id,
        seat_type_name: seat.seat_type_name
      }))
    });

  } catch (error) {
    console.error('Error fetching seats with status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export const getOccupieSeat = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    if (!showtimeId || isNaN(showtimeId)) {
      return res.status(400).json({ error: 'Invalid showtimeId' });
    }

    const query = `
      SELECT seat_id, seat_number, status, reservation_id, expiry_time, seat_type_id
      FROM show_seats 
      WHERE showtime_id = ? AND status IN ('reserved', 'booked')
    `;
    
    const [rows] = await dbPool.query(query, [showtimeId]);

    if (rows.length === 0) {
      return res.status(200).json({ occupiedSeats: [] });
    }

    return res.status(200).json({ occupiedSeats: rows });
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getShowTimeByCine = async (req, res) => {
  try {
    const { cinema_Id, date } = req.params;

    if (!cinema_Id || !date) {
      return res.status(400).json({
        success: false,
        message: "Thiếu cinema_Id hoặc date",
      });
    }

    const [movieRows] = await dbPool.query(
      `
      SELECT DISTINCT
        m.id AS movie_id,
        m.title,
        m.poster_path,
        m.runtime
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE r.cinema_clusters_id = ?
        AND DATE(s.start_time) = ?
        AND s.status IN ('Ongoing', 'Scheduled')
      ORDER BY m.title ASC;
      `,
      [cinema_Id, date]
    );

    if (movieRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có suất chiếu nào cho ngày này tại rạp",
      });
    }

    const movies = [];
    for (const movie of movieRows) {
      const [showtimeRows] = await dbPool.query(
        `
        SELECT 
          s.id AS showtime_id,
          r.name AS room_name,
          s.start_time,
          s.end_time,
          s.status
        FROM showtimes s
        JOIN rooms r ON s.room_id = r.id
        WHERE s.movie_id = ?
          AND r.cinema_clusters_id = ?
          AND DATE(s.start_time) = ?
          AND s.status IN ('Ongoing', 'Scheduled');
        `,
        [movie.movie_id, cinema_Id, date]
      );

      movies.push({
        movie_id: movie.movie_id,
        title: movie.title,
        poster_path: movie.poster_path,
        runtime: movie.runtime,
        showtimes: showtimeRows,
      });
    }

    res.status(200).json({
      success: true,
      cinema_id: cinema_Id,
      date,
      movies,
    });
  } catch (error) {
    console.error("❌ Lỗi getShowTimeByCine:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
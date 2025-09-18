import dbPool from "../config/mysqldb.js";

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
       ORDER BY s.start_time ASC`,
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

      // Kiểm tra trùng suất chiếu trong cùng phòng
      const [exist] = await dbPool.query(
        `SELECT * FROM showtimes 
         WHERE room_id = ?
           AND (
             (start_time <= ? AND end_time > ?) OR
             (start_time < ? AND end_time >= ?)
           )`,
        [room_id, start_time, start_time, end_time, end_time]
      );

      if (exist.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: `Phòng đã có suất chiếu trong khoảng thời gian ${start_time}` });
      }

      const [result] = await dbPool.query(
        `INSERT INTO showtimes (movie_id, room_id, start_time, end_time) 
         VALUES (?, ?, ?, ?)`,
        [movie_id, room_id, start_time, end_time]
      );

      insertedIds.push(result.insertId);
    }

    res.status(201).json({ success: true, ids: insertedIds, message: "Thêm lịch chiếu thành công" });
  } catch (error) {
    console.error("❌ Lỗi createShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật lịch chiếu
export const updateShowTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time ,status} = req.body;

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

    await dbPool.query(
      `UPDATE showtimes 
       SET start_time = ?, end_time = ? ,status= ?
       WHERE id = ?`,
      [start_time, end_time,status, id]
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
    console.error("❌ Lỗi deleteShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
// In your backend file (e.g., showtimeController.js)
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

    // Process rows to format genres and actors as arrays
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

    // Fetch movie details with genres and actors
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

    // Fetch showtimes with cinema names
    const [showtimeRows] = await dbPool.query(
      `SELECT s.*, r.name AS room_name, c.name AS cinema_name
       FROM showtimes s
       JOIN rooms r ON s.room_id = r.id
       JOIN cinema_clusters c ON r.cinema_clusters_id = c.id
       WHERE s.movie_id = ? AND s.status IN ('Ongoing', 'Scheduled')
       ORDER BY s.start_time ASC`,
      [movie_id]
    );

    // Format the movie data
    const movie = {
      ...movieRows[0],
      genres: movieRows[0].genres ? movieRows[0].genres.split(',').filter(g => g.trim()) : [],
      actors: movieRows[0].actors ? JSON.parse(`[${movieRows[0].actors}]`) : [],
    };

    // Format showtimes with cinema names
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
    });
  } catch (error) {
    console.error("❌ Lỗi getShow:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getCinemaByMovie = async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Fetch unique cinemas with showtimes for the movie
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

    // Format response as array of cinema objects
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
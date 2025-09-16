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
         AND s.start_time > NOW()
       ORDER BY s.start_time ASC`,
      [cinemaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không có lịch chiếu sắp tới" });
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
    const { movie_id, room_id, start_time, end_time } = req.body;

    // TODO: Kiểm tra trùng suất chiếu trong cùng phòng
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
        .json({ message: "Phòng đã có suất chiếu trong khoảng thời gian này" });
    }

    const [result] = await dbPool.query(
      `INSERT INTO showtimes (movie_id, room_id, start_time, end_time) 
       VALUES (?, ?, ?, ?)`,
      [movie_id, room_id, start_time, end_time]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("❌ Lỗi createShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật lịch chiếu
export const updateShowTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    // Kiểm tra lịch chiếu còn cách ít nhất 1 ngày
    const [rows] = await dbPool.query(
      `SELECT * FROM showtimes WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy lịch chiếu" });
    }

    const showtime = rows[0];
    const now = new Date();
    const start = new Date(showtime.start_time);

    if ((start - now) / (1000 * 60 * 60 * 24) < 1) {
      return res
        .status(400)
        .json({ message: "Chỉ được sửa lịch chiếu trước ít nhất 1 ngày" });
    }

    await dbPool.query(
      `UPDATE showtimes 
       SET start_time = ?, end_time = ? 
       WHERE id = ?`,
      [start_time, end_time, id]
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
      return res.status(404).json({ message: "Không tìm thấy lịch chiếu" });
    }

    const showtime = rows[0];
    const now = new Date();
    const start = new Date(showtime.start_time);

    if (start <= now) {
      return res
        .status(400)
        .json({ message: "Không thể xóa lịch chiếu đã hoặc đang diễn ra" });
    }

    await dbPool.query(`DELETE FROM showtimes WHERE id = ?`, [id]);

    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    console.error("❌ Lỗi deleteShowTime:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

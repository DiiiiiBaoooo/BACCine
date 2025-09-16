import dbPool from "../config/mysqldb.js";

// 📌 Lấy tất cả phòng theo cinema_clusters_id
export const getRoomsOfCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;
    const [rows] = await dbPool.query(
      "SELECT * FROM rooms WHERE cinema_clusters_id = ?",
      [cinemaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu phòng chiếu tại rạp này",
      });
    }

    res.status(200).json({ success: true, rooms: rows });
  } catch (error) {
    console.error("❌ Lỗi getRoomsOfCinema:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Lấy chi tiết 1 phòng theo id
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await dbPool.query("SELECT * FROM rooms WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng chiếu" });
    }

    res.status(200).json({ success: true, room: rows[0] });
  } catch (error) {
    console.error("❌ Lỗi getRoomById:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Thêm phòng chiếu
export const createRoom = async (req, res) => {
  try {
    const { cinema_clusters_id, name, capacity, type, status } = req.body;

    if (!cinema_clusters_id || !name || !capacity) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }

    const [result] = await dbPool.query(
      "INSERT INTO rooms (cinema_clusters_id, name, capacity, type, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [cinema_clusters_id, name, capacity, type || "2D", status || "AVAILABLE"]
    );

    res.status(201).json({
      success: true,
      message: "Thêm phòng chiếu thành công",
      room: { id: result.insertId, cinema_clusters_id, name, capacity, type, status },
    });
  } catch (error) {
    console.error("❌ Lỗi createRoom:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Cập nhật phòng chiếu
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, type, status } = req.body;

    const [result] = await dbPool.query(
      "UPDATE rooms SET name = ?, capacity = ?, type = ?, status = ? WHERE id = ?",
      [name, capacity, type, status, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng để cập nhật" });
    }

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("❌ Lỗi updateRoom:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Xóa phòng chiếu
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await dbPool.query("DELETE FROM rooms WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng để xóa" });
    }

    res.json({ success: true, message: "Xóa phòng chiếu thành công" });
  } catch (error) {
    console.error("❌ Lỗi deleteRoom:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

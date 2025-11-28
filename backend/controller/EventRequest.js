import dbPool from "../config/mysqldb.js";

// ===================== USER ENDPOINTS =====================

// 1. Tạo yêu cầu tổ chức sự kiện (GIỮ NGUYÊN)
export const createEventRequest = async (req, res) => {
  try {
    const {
      cinema_id,
      movie_id,
      room_id,
      event_date,
      start_time,
      guest_count,
      contact_name,
      contact_phone,
      contact_email,
      special_requirements
    } = req.body;

    const user_id = req.user.id;

    if (!cinema_id || !movie_id || !event_date || !start_time || !guest_count || !contact_name || !contact_phone || !contact_email) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc"
      });
    }

    if (guest_count < 1) {
      return res.status(400).json({
        success: false,
        message: "Số lượng khách phải lớn hơn 0"
      });
    }

    const [movie] = await dbPool.query(
      "SELECT runtime FROM movies WHERE id = ?",
      [movie_id]
    );

    if (movie.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim"
      });
    }

    const runtime = movie[0].runtime;
    const end_time = calculateEndTime(start_time, runtime);

    const [result] = await dbPool.query(
      `INSERT INTO event_requests 
       (user_id, cinema_id, movie_id, room_id, event_date, start_time, end_time, 
        guest_count, contact_name, contact_phone, contact_email, special_requirements, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [user_id, cinema_id, movie_id, room_id, event_date, start_time, end_time, 
       guest_count, contact_name, contact_phone, contact_email, special_requirements]
    );

    await dbPool.query(
      `INSERT INTO event_request_history (event_request_id, new_status, changed_by, note)
       VALUES (?, 'pending', ?, 'Yêu cầu được tạo')`,
      [result.insertId, user_id]
    );

    res.status(201).json({
      success: true,
      message: "Tạo yêu cầu sự kiện thành công",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("❌ Lỗi createEventRequest:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// 2. Lấy danh sách yêu cầu của user (GIỮ NGUYÊN)
export const getUserEventRequests = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status } = req.query;

    let query = "SELECT * FROM event_requests_detail WHERE user_id = ?";
    const params = [user_id];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const [requests] = await dbPool.query(query, params);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("❌ Lỗi getUserEventRequests:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ⭐ 3. MỚI: Khởi tạo thanh toán (trước khi chấp nhận)
export const initiateEventPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Lấy thông tin event request
    const [requestRows] = await dbPool.query(
      `SELECT * FROM event_requests_detail 
       WHERE id = ? AND user_id = ? AND status = 'quoted'`,
      [id, user_id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoặc chưa được báo giá"
      });
    }

    const eventData = requestRows[0];

    // Kiểm tra đã có quoted_price chưa
    if (!eventData.quoted_price || eventData.quoted_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu chưa có giá báo giá hợp lệ"
      });
    }

    // Cập nhật status thành "payment_pending"
    await dbPool.query(
      `UPDATE event_requests 
       SET status = 'quoted', updated_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    // Log history
    await dbPool.query(
      `INSERT INTO event_request_history 
       (event_request_id, old_status, new_status, changed_by, note)
       VALUES (?, 'quoted', 'payment_pending', ?, 'Khách hàng bắt đầu thanh toán')`,
      [id, user_id]
    );

    // Trả về thông tin để frontend tạo QR payment
    res.json({
      success: true,
      message: "Khởi tạo thanh toán thành công",
      data: {
        event_id: id,
        amount: eventData.quoted_price,
        movie_title: eventData.movie_title,
        cinema_name: eventData.cinema_name,
        event_date: eventData.event_date,
        start_time: eventData.start_time,
        guest_count: eventData.guest_count,
        payment_content: `EVENTPAY ${id}` // Nội dung chuyển khoản
      }
    });
  } catch (error) {
    console.error("❌ Lỗi initiateEventPayment:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ⭐ 4. CHỈNH SỬA: acceptQuote - Chỉ được gọi từ Webhook sau khi thanh toán thành công
export const acceptQuote = async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const user_id = req.user?.id; // Có thể null nếu gọi từ webhook

    // 1. Lấy dữ liệu yêu cầu
    const [requestRows] = await connection.query(
      `SELECT er.*, m.runtime 
       FROM event_requests er
       JOIN movies m ON er.movie_id = m.id
       WHERE er.id = ? AND er.status = 'quoted'`,
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoặc chưa thanh toán"
      });
    }

    const eventData = requestRows[0];
    const cinemaId = eventData.cinema_id;
    const movieRuntime = eventData.runtime;

    // Chuẩn hóa ngày
    const normalizeDate = (dateInput) => {
      if (!dateInput) return null;
      let dateStr;
      if (dateInput instanceof Date) {
        dateStr = dateInput.toISOString().split("T")[0];
      } else if (typeof dateInput === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          dateStr = dateInput;
        } else {
          const match = dateInput.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
          if (match) {
            const [, d, m, y] = match;
            dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          } else {
            throw new Error("Định dạng ngày không hợp lệ");
          }
        }
      } else {
        throw new Error("Kiểu dữ liệu ngày không hỗ trợ");
      }
      return dateStr;
    };

    const eventDateISO = normalizeDate(eventData.event_date);

    // Tính end_time
    const [startHour, startMinute] = eventData.start_time.split(":").map(Number);
    const totalMinutes = startHour * 60 + startMinute + movieRuntime + 15;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    const end_time = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`;

    const fullStartTime = `${eventDateISO} ${eventData.start_time}:00`;
    const fullEndTime = `${eventDateISO} ${end_time}`;

    // 2. Lấy danh sách phòng
    const [rooms] = await connection.query(
      "SELECT id, name FROM rooms WHERE cinema_clusters_id = ? AND status = 'AVAILABLE'",
      [cinemaId]
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Rạp hiện không có phòng chiếu nào khả dụng"
      });
    }

    // 3. Tìm phòng trống
    let availableRoom = null;
    for (const room of rooms) {
      const [conflict] = await connection.query(
        `SELECT id FROM showtimes 
         WHERE room_id = ? 
           AND DATE(start_time) = ?
           AND status IN ('Scheduled', 'Ongoing')
           AND (
             (start_time < ? AND end_time > ?) OR
             (start_time < ? AND end_time > ?)
           )`,
        [room.id, eventDateISO, fullEndTime, fullStartTime, fullStartTime, fullEndTime]
      );

      if (conflict.length === 0) {
        availableRoom = room;
        break;
      }
    }

    if (!availableRoom) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Không còn phòng trống trong khung giờ này"
      });
    }

    // 4. Tạo suất chiếu
    const [showtimeResult] = await connection.query(
      `INSERT INTO showtimes 
       (movie_id, room_id, start_time, end_time, status) 
       VALUES (?, ?, ?, ?, 'Scheduled')`,
      [eventData.movie_id, availableRoom.id, fullStartTime, fullEndTime]
    );

    const showtimeId = showtimeResult.insertId;

    // 5. Tạo ghế + đặt hết
    const seatEntries = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    for (const row of rows) {
      const maxSeats = row <= "H" ? 9 : 4;
      const seatTypeId = row === "A" || row === "B" ? 1 : row === "I" || row === "J" ? 3 : 2;

      for (let n = 1; n <= maxSeats; n++) {
        seatEntries.push([showtimeId, `${row}${n}`, "booked", seatTypeId]);
      }
    }

    if (seatEntries.length > 0) {
      await connection.query(
        `INSERT INTO show_seats (showtime_id, seat_number, status, seat_type_id) VALUES ?`,
        [seatEntries]
      );
    }

    // 6. Cập nhật event request
    await connection.query(
      `UPDATE event_requests 
       SET status = 'accepted', 
           showtime_id = ?, 
           room_id = ?,
           accepted_at = NOW() 
       WHERE id = ?`,
      [showtimeId, availableRoom.id, id]
    );

    // 7. Log lịch sử
    await connection.query(
      `INSERT INTO event_request_history 
       (event_request_id, old_status, new_status, changed_by, note) 
       VALUES (?, 'payment_pending', 'accepted', ?, ?)`,
      [
        id,
        user_id || eventData.user_id,
        `Thanh toán thành công - Tạo suất chiếu riêng tại phòng ${availableRoom.name}`
      ]
    );

    await connection.commit();

    const [fullData] = await connection.query(
      "SELECT * FROM event_requests_detail WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: `Thanh toán và tạo suất chiếu thành công tại phòng "${availableRoom.name}"`,
      data: {
        ...fullData[0],
        selected_room: {
          id: availableRoom.id,
          name: availableRoom.name
        },
        showtime_id: showtimeId,
        start_time: fullStartTime,
        end_time: fullEndTime
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Lỗi acceptQuote:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống"
    });
  } finally {
    if (connection) connection.release();
  }
};
// Trong file controller của bạn
export const checkEventRequestPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await dbPool.query(
      `SELECT status, showtime_id FROM event_requests WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu"
      });
    }

    const { status, showtime_id } = rows[0];

    res.json({
      success: true,
      data: {
        isPaid: status === "accepted",
        status,
        hasShowtime: !!showtime_id
      }
    });

  } catch (error) {
    console.error("Lỗi checkEventRequestPaymentStatus:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
// 5. Hủy yêu cầu (GIỮ NGUYÊN)
export const cancelEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [result] = await dbPool.query(
      `UPDATE event_requests 
       SET status = 'cancelled' 
       WHERE id = ? AND user_id = ? AND status IN ('quoted', 'pending')`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy yêu cầu"
      });
    }

    await dbPool.query(
      `INSERT INTO event_request_history (event_request_id, new_status, changed_by, note)
       VALUES (?, 'cancelled', ?, 'Khách hàng hủy yêu cầu')`,
      [id, user_id]
    );

    res.json({
      success: true,
      message: "Hủy yêu cầu thành công"
    });
  } catch (error) {
    console.error("❌ Lỗi cancelEventRequest:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ===================== MANAGER ENDPOINTS (GIỮ NGUYÊN) =====================

export const getManagerEventRequests = async (req, res) => {
  try {
    const manager_id = req.user.id;
    const { status, cinema_id } = req.query;

    let query = `
      SELECT er.* FROM event_requests_detail er
      INNER JOIN cinema_clusters cc ON er.cinema_id = cc.id
      WHERE cc.manager_id = ?
    `;
    const params = [manager_id];

    if (status) {
      query += " AND er.status = ?";
      params.push(status);
    }

    if (cinema_id) {
      query += " AND er.cinema_id = ?";
      params.push(cinema_id);
    }

    query += " ORDER BY er.created_at DESC";

    const [requests] = await dbPool.query(query, params);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("❌ Lỗi getManagerEventRequests:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const quoteEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { quoted_price, quote_note, room_id } = req.body;
    const manager_id = req.user.id;

    if (!quoted_price || quoted_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Giá báo không hợp lệ"
      });
    }

    const [request] = await dbPool.query(
      `SELECT er.* FROM event_requests er
       INNER JOIN cinema_clusters cc ON er.cinema_id = cc.id
       WHERE er.id = ? AND cc.manager_id = ? AND er.status = 'pending'`,
      [id, manager_id]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoặc không có quyền xử lý"
      });
    }

    if (room_id) {
      const eventData = request[0];
      const [conflicts] = await dbPool.query(
        `SELECT * FROM showtimes 
         WHERE room_id = ?
           AND DATE(start_time) = ?
           AND (
             (TIME(start_time) <= ? AND TIME(end_time) > ?) OR
             (TIME(start_time) < ? AND TIME(end_time) >= ?)
           )`,
        [room_id, eventData.event_date, eventData.start_time, eventData.start_time, 
         eventData.end_time, eventData.end_time]
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Phòng đã có lịch chiếu trong khung giờ này"
        });
      }
    }

    await dbPool.query(
      `UPDATE event_requests 
       SET status = 'quoted', 
           quoted_price = ?, 
           quote_note = ?,
           room_id = COALESCE(?, room_id),
           quoted_at = NOW(),
           quoted_by = ?
       WHERE id = ?`,
      [quoted_price, quote_note, room_id, manager_id, id]
    );

    await dbPool.query(
      `INSERT INTO event_request_history (event_request_id, old_status, new_status, changed_by, note)
       VALUES (?, 'pending', 'quoted', ?, ?)`,
      [id, manager_id, `Báo giá: ${quoted_price.toLocaleString('vi-VN')} VNĐ`]
    );

    res.json({
      success: true,
      message: "Báo giá thành công"
    });
  } catch (error) {
    console.error("❌ Lỗi quoteEventRequest:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const rejectEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const manager_id = req.user.id;

    const [result] = await dbPool.query(
      `UPDATE event_requests er
       INNER JOIN cinema_clusters cc ON er.cinema_id = cc.id
       SET er.status = 'rejected'
       WHERE er.id = ? AND cc.manager_id = ? AND er.status = 'pending'`,
      [id, manager_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoặc không có quyền xử lý"
      });
    }

    await dbPool.query(
      `INSERT INTO event_request_history (event_request_id, old_status, new_status, changed_by, note)
       VALUES (?, 'pending', 'rejected', ?, ?)`,
      [id, manager_id, reason || 'Manager từ chối yêu cầu']
    );

    res.json({
      success: true,
      message: "Từ chối yêu cầu thành công"
    });
  } catch (error) {
    console.error("❌ Lỗi rejectEventRequest:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ===================== HELPER FUNCTIONS =====================

function calculateEndTime(start_time, runtime) {
  const [hours, minutes] = start_time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + runtime + 15;
  
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}
// backend/routes/tickets.js (hoặc backend/controller/Users.js)
import express from 'express';
import QRCode from 'qrcode';
import dbPool from '../config/mysqldb.js';
import { createCanvas, loadImage } from 'canvas';

export const getMyTickets = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy người dùng. Vui lòng đăng nhập lại.',
    });
  }

  const userId = req.user.id;

  try {
    const [rows] = await dbPool.query(
      `
      SELECT 
        o.order_id,
        o.status AS order_status,
        o.total_amount,
        movie_id,         
  o.showtime_id,
        o.updated_at AS ThoiGianThanhToan,
        o.order_date,
        st.start_time AS GioBatDau,
        st.end_time AS GioKetThuc,
        m.title AS movie_title,
        m.runtime,
        m.poster_path,
        r.name AS PhongChieu,
        cs.name AS RapChieu,
        ot.order_ticket_id AS ticket_id,
        ot.ticket_price,
        ss.seat_number
      FROM orders o
      JOIN showtimes st ON o.showtime_id = st.id
      JOIN movies m ON st.movie_id = m.id
      JOIN rooms r ON st.room_id = r.id
      JOIN cinema_clusters cs ON r.cinema_clusters_id = cs.id
      LEFT JOIN orderticket ot ON ot.order_id = o.order_id
      LEFT JOIN show_seats ss ON ot.seat_id = ss.seat_id
      WHERE o.user_id = ?
      ORDER BY o.updated_at DESC, o.order_id, ss.seat_number ASC
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        tickets: [],
      });
    }

    const ticketsByOrder = {};

    rows.forEach((row) => {
      const orderId = row.order_id;

      if (!ticketsByOrder[orderId]) {
        ticketsByOrder[orderId] = {
          order_id: orderId,
          order_status: row.order_status,
          total_amount: row.total_amount,
          ThoiGianThanhToan: row.ThoiGianThanhToan,
          order_date: row.order_date,
          GioBatDau: row.GioBatDau,
          GioKetThuc: row.GioKetThuc,
          movie_title: row.movie_title,
          runtime: row.runtime,
          poster_path: row.poster_path,
          PhongChieu: row.PhongChieu,
          movie_id: row.movie_id,        // THÊM DÒNG NÀY
    showtime_id: row.showtime_id,
          RapChieu: row.RapChieu,
          seats: [],
        };
      }

      if (row.seat_number) {
        ticketsByOrder[orderId].seats.push({
          seat_number: row.seat_number,
          ticket_id: row.ticket_id,
          ticket_price: row.ticket_price,
        });
      }
    });

    const ticketsWithQR = await Promise.all(
      Object.values(ticketsByOrder).map(async (order) => {
        const validationUrl = `https://bac-cine.vercel.app/inve/${order.order_id}`;
        const qrBase64 = await QRCode.toDataURL(validationUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000FF',
            light: '#FFFFFFFF',
          },
        });

        return {
          ...order,
          qrCode: qrBase64,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: ticketsWithQR.length,
      tickets: ticketsWithQR,
    });
  } catch (err) {
    console.error('Lỗi lấy vé:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách vé',
      error: err.message,
    });
  }
};

export const getTicketByOrderId = async (req, res) => {
  const { order_id } = req.params;
  const user = req.user;

  console.log('🎫 getTicketByOrderId called:');
  console.log('- order_id:', order_id);
  console.log('- user:', { id: user.id, role: user.role, cinemaId: user.cinemaId });

  if (!order_id) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu mã đơn hàng',
    });
  }

  try {
    const [rows] = await dbPool.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.status AS order_status,
        o.total_amount,
        o.updated_at AS ThoiGianThanhToan,
        o.order_date,
          o.showtime_id,
          movie_id,

        st.start_time AS GioBatDau,
        st.end_time AS GioKetThuc,
        m.title AS movie_title,
        m.runtime,
        m.poster_path,
        r.name AS PhongChieu,
        cs.id as cinema_id,
        cs.name AS RapChieu,
        ot.order_ticket_id AS ticket_id,
        ot.ticket_price,
        ss.seat_number
      FROM orders o
      JOIN showtimes st ON o.showtime_id = st.id
      JOIN movies m ON st.movie_id = m.id
      JOIN rooms r ON st.room_id = r.id
      JOIN cinema_clusters cs ON r.cinema_clusters_id = cs.id
      LEFT JOIN orderticket ot ON ot.order_id = o.order_id
      LEFT JOIN show_seats ss ON ot.seat_id = ss.seat_id
      WHERE o.order_id = ?
      ORDER BY ss.seat_number ASC
      `,
      [order_id]
    );

    if (rows.length === 0) {
      console.log('❌ Không tìm thấy order trong DB');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé',
      });
    }

    console.log('✅ Tìm thấy order, số rows:', rows.length);
    console.log('- Order user_id:', rows[0].user_id);
    console.log('- Current user id:', user.id);
    console.log('- Order cinema_id:', rows[0].cinema_id);
    console.log('- User cinemaId:', user.cinemaId);

    const orderUserId = rows[0].user_id;
    const orderCinemaId = rows[0].cinema_id;

    // ⭐ LOGIC KIỂM TRA QUYỀN:
    // 1. Nếu là USER thường (customer): chỉ xem được vé của mình
    if (user.role === 'user') {
      if (user.id !== orderUserId) {
        console.log('❌ Customer không có quyền xem vé của người khác');
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem vé này',
        });
      }
      console.log('✅ Customer xem vé của chính mình');
    }

    // 2. Nếu là EMPLOYEE hoặc MANAGER: chỉ xem được vé thuộc rạp của mình
    if (user.role === 'employee' || user.role === 'manager') {
 
      console.log('✅ Employee/Manager có quyền xem vé thuộc rạp của mình');
    }

    // Tổ chức dữ liệu
    const order = {
      order_id: rows[0].order_id,
      order_status: rows[0].order_status,
      total_amount: rows[0].total_amount,
      ThoiGianThanhToan: rows[0].ThoiGianThanhToan,
      order_date: rows[0].order_date,
      GioBatDau: rows[0].GioBatDau,
      GioKetThuc: rows[0].GioKetThuc,
      movie_title: rows[0].movie_title,
      runtime: rows[0].runtime,
      poster_path: rows[0].poster_path,
      PhongChieu: rows[0].PhongChieu,
      RapChieu: rows[0].RapChieu,
      seats: [],
    };

    rows.forEach((row) => {
      if (row.seat_number) {
        order.seats.push({
          seat_number: row.seat_number,
          ticket_id: row.ticket_id,
          ticket_price: row.ticket_price,
        });
      }
    });

    // Tạo QR code
    const validationUrl = `https://bac-cine.vercel.app/inve/${order.order_id}`;
    const qrBase64 = await QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000FF',
        light: '#FFFFFFFF',
      },
    });

    order.qrCode = qrBase64;

    console.log('✅ Returning ticket data');
    return res.status(200).json({
      success: true,
      ticket: order,
    });
  } catch (err) {
    console.error('❌ Error in getTicketByOrderId:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin vé',
      error: err.message,
    });
  }
};
export const cancelTicket = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    // Bắt đầu transaction
    await dbPool.query('START TRANSACTION');

    // 1. Kiểm tra đơn hàng có tồn tại và thuộc về user không
    const [orderCheck] = await dbPool.query(
      `SELECT o.*, s.start_time, s.movie_id, m.title as movie_title
       FROM orders o
       JOIN showtimes s ON o.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       WHERE o.order_id = ? AND o.user_id = ? AND o.status = 'confirmed'`,
      [orderId, userId]
    );

    if (orderCheck.length === 0) {
      await dbPool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng đã bị hủy'
      });
    }

    const order = orderCheck[0];
    const showtimeStart = new Date(order.start_time);
    const now = new Date();
    const timeDiff = showtimeStart - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // 2. Kiểm tra thời gian hủy (phải trước 1 tiếng)
    if (hoursDiff < 1) {
      await dbPool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy vé trước suất chiếu ít nhất 1 tiếng'
      });
    }

    // 3. Lấy tổng giá trị vé từ orderticket
    const [ticketPrices] = await dbPool.query(
      'SELECT total_amount as total_ticket_price FROM orders WHERE order_id = ?',
      [orderId]
    );

    const totalTicketPrice = ticketPrices[0].total_ticket_price || 0;
    console.log(totalTicketPrice);
    
    if (Number(totalTicketPrice) === 0) {
      await dbPool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Vé có giá trị không thể hủy'
      });
    }

    // 4. Cập nhật trạng thái đơn hàng thành 'cancelled'
    await dbPool.query(
      'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE order_id = ?',
      [orderId]
    );

    // 5. Giải phóng ghế đã đặt
    await dbPool.query(
      `UPDATE show_seats ss
       JOIN orderticket ot ON ss.seat_id = ot.seat_id
       SET ss.status = 'available', ss.reservation_id = NULL
       WHERE ot.order_id = ?`,
      [orderId]
    );

    // 6. Tạo voucher giảm giá
    const voucherCode = generateVoucherCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Voucher hết hạn sau 30 ngày

    await dbPool.query(
      `INSERT INTO gift (user_id, reward, reward_type, points_spent, voucher_code, 
       discount_type, discount_value, created_at, used, expires_at)
       VALUES (?, ?, 'voucher', 0, ?, 'fixed', ?, NOW(), 0, ?)`,
      [
        userId,
        `Hoàn tiền hủy vé ${order.movie_title}`,
        voucherCode,
        totalTicketPrice,
        expiryDate
      ]
    );

    // 7. Commit transaction
    await dbPool.query('COMMIT');

    res.json({
      success: true,
      message: 'Hủy vé thành công',
      data: {
        orderId: orderId,
        refundAmount: totalTicketPrice,
        voucherCode: voucherCode,
        expiryDate: expiryDate
      }
    });

  } catch (error) {
    await dbPool.query('ROLLBACK');
    console.error('Error cancelling ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi hủy vé',
      error: error.message
    });
  }
}
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BAC'; // Prefix
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
export const checkCancelTicket = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  try {
     const [orderCheck] = await dbPool.query(
      `SELECT o.*, s.start_time, s.movie_id, m.title as movie_title
       FROM orders o
       JOIN showtimes s ON o.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       WHERE o.order_id = ? AND o.user_id = ? AND o.status = 'confirmed'`,
      [orderId, userId]
    );

    if (orderCheck.length === 0) {
      return res.json({
        canCancel: false,
        reason: 'Không tìm thấy đơn hàng hoặc đơn hàng đã bị hủy'
      });
    }
 const order = orderCheck[0];
    const showtimeStart = new Date(order.start_time);
    const now = new Date();
    const timeDiff = showtimeStart - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return res.json({
        canCancel: false,
        reason: 'Chỉ có thể hủy vé trước suất chiếu ít nhất 1 tiếng',
        hoursRemaining: hoursDiff.toFixed(2)
      });
    }

    // Lấy giá trị hoàn lại
    const [ticketPrices] = await dbPool.query(
      'SELECT total_amount as total_ticket_price FROM orders WHERE order_id = ?',
      [orderId]
    );
        const totalTicketPrice = ticketPrices[0].total_ticket_price || 0;

if (Number(totalTicketPrice) === 0) {
    return res.json({
        canCancel: false,
        reason: 'Không thể hủy vé miễn phí',
        hoursRemaining: hoursDiff.toFixed(2)
      });
    }
    res.json({
      canCancel: true,
      refundAmount: ticketPrices[0].total_ticket_price || 0,
      hoursRemaining: hoursDiff.toFixed(2),
      movieTitle: order.movie_title,
      showtimeStart: order.start_time
    });

  } catch (error) {
      console.error('Error checking cancellable:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
      error: error.message
    });
  }
}
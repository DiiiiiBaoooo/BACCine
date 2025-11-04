// routes/tickets.js
import express from 'express';
import QRCode from 'qrcode';
import dbPool from '../config/mysqldb.js';
import { createCanvas, loadImage } from 'canvas';


const router = express.Router();

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

    // Nếu không có đơn hàng nào
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        tickets: [],
      });
    }

    // Group theo order_id
    const ticketsByOrder = {};

    rows.forEach((row) => {
      const orderId = row.order_id;

      // Tạo mới nếu chưa có
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
          RapChieu: row.RapChieu,
          seats: [],
        };
      }

      // Chỉ thêm ghế nếu có (tránh null)
      if (row.seat_number) {
        ticketsByOrder[orderId].seats.push({
          seat_number: row.seat_number,
          ticket_id: row.ticket_id,
          ticket_price: row.ticket_price,
        });
      }
    });

    // Tạo QR cho từng đơn hàng
    const ticketsWithQR = await Promise.all(
      Object.values(ticketsByOrder).map(async (order) => {
        const validationUrl = `http://localhost:5173/inve/${order.order_id}`;
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


export const Inve = async (req,res) => {
  try {
    
  } catch (error) {
    
  }
}
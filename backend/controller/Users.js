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
          o.order_id AS order_id,
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
      JOIN orderticket ot ON ot.order_id = o.order_id
      JOIN show_seats ss ON ot.seat_id = ss.seat_id
      WHERE o.user_id = ?
      ORDER BY o.updated_at DESC, ss.seat_number ASC
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

    // Group tickets by order_id and generate QR for each order
    const ticketsByOrder = {};
    rows.forEach((ticket) => {
      if (!ticketsByOrder[ticket.order_id]) {
        ticketsByOrder[ticket.order_id] = {
          order_id: ticket.order_id,
          order_status: ticket.order_status,
          total_amount: ticket.total_amount,
          ThoiGianThanhToan: ticket.ThoiGianThanhToan,
          order_date: ticket.order_date,
          GioBatDau: ticket.GioBatDau,
          GioKetThuc: ticket.GioKetThuc,
          movie_title: ticket.movie_title,
          runtime: ticket.runtime,
          poster_path: ticket.poster_path,
          PhongChieu: ticket.PhongChieu,
          RapChieu: ticket.RapChieu,
          seats: [],
        };
      }
      ticketsByOrder[ticket.order_id].seats.push({
        seat_number: ticket.seat_number,
        ticket_id: ticket.ticket_id,
        ticket_price: ticket.ticket_price,
      });
    });

    // Generate QR code for each order
    const ticketsWithQR = await Promise.all(
      Object.values(ticketsByOrder).map(async (order) => {
        const validationUrl = `http://localhost:5173/inve/${order.order_id}/${userId}`;
        const qrBase64 = await QRCode.toDataURL(validationUrl, {
          errorCorrectionLevel: 'H', // High error correction
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000FF', // Black
            light: '#FFFFFFFF'  // White
          }
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


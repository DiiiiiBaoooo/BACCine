import dbPool from "../config/mysqldb.js";
import { inngest } from '../inggest/index.js';

export const createBooking = async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    // Kiểm tra Inngest keys
    if (!process.env.INNGEST_EVENT_KEY || !process.env.INNGEST_SIGNING_KEY) {
      console.error('Missing Inngest keys:', {
        eventKey: process.env.INNGEST_EVENT_KEY,
        signingKey: process.env.INNGEST_SIGNING_KEY,
      });
      return res.status(500).json({ success: false, message: 'Cấu hình Inngest không đầy đủ' });
    }

    const {
      cinema_id,
      user_id,
      showtime_id,
      tickets,
      services,
      payment_method,
      promotion_id,
      phone,
      employeeId,
      status: clientStatus,
      grand_total: clientGrandTotal
    } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!showtime_id || !tickets || !Array.isArray(tickets) || tickets.length === 0 || !payment_method) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    if (!clientStatus || !['pending', 'confirmed'].includes(clientStatus)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    // Kiểm tra định dạng tickets
    for (const ticket of tickets) {
      if (!ticket.seat_id || !ticket.ticket_price || typeof ticket.ticket_price !== 'number') {
        return res.status(400).json({ success: false, message: 'Dữ liệu ticket không hợp lệ' });
      }
    }

    // Kiểm tra services
    if (services && !Array.isArray(services)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu services phải là mảng' });
    }
    for (const service of services || []) {
      if (!service.service_id || !service.quantity || !Number.isInteger(service.quantity) || service.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu service không hợp lệ' });
      }
    }

    const [showtimeRows] = await connection.query('SELECT id FROM showtimes WHERE id = ?', [showtime_id]);
    if (showtimeRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Suất chiếu không tồn tại' });
    }

    // 2. Kiểm tra employee_id nếu có
    if (employeeId) {
      const [employeeRows] = await connection.query('SELECT id FROM users WHERE id = ? AND role = "employee"', [employeeId]);
      if (employeeRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Nhân viên không tồn tại hoặc không hợp lệ' });
      }
    }

    // 3. Kiểm tra ghế
    const seatNumbers = tickets.map(t => t.seat_id);
    const [seatRows] = await connection.query(
      `
      SELECT 
        s.seat_id,
        s.seat_number,
        s.status,
        s.reservation_id,
        CASE 
          WHEN DAYOFWEEK(DATE(st.start_time)) IN (1, 7) THEN tp.weekend_price  -- Chủ nhật = 1, Thứ 7 = 7
          ELSE tp.base_price 
        END AS ticket_price
      FROM show_seats s
      JOIN showtimes st ON s.showtime_id = st.id
      JOIN seat_types seat_type ON s.seat_type_id = seat_type.id
      JOIN ticket_prices tp ON seat_type.id = tp.seat_type_id AND tp.cinema_id = ?
      WHERE s.showtime_id = ?
        AND s.seat_number IN (?)
      `,
      [cinema_id, showtime_id, seatNumbers]
    );
    if (seatRows.length !== seatNumbers.length) {
      return res.status(400).json({ success: false, message: 'Một hoặc nhiều ghế không tồn tại' });
    }
    for (const seat of seatRows) {
      if (seat.status !== 'available' || seat.reservation_id !== null) {
        return res.status(400).json({ success: false, message: `Ghế ${seat.seat_number} đã được đặt` });
      }
    }

    // 4. Tính tiền vé
    const ticket_total = tickets.reduce((sum, t) => sum + t.ticket_price, 0);

    // 5. Tính tiền dịch vụ
    let service_total = 0;
    if (services && services.length > 0) {
      const serviceIds = services.map(s => s.service_id);
      const [serviceRows] = await connection.query('SELECT id, price, quantity AS stock FROM services WHERE id IN (?)', [serviceIds]);

      for (const service of services) {
        const serviceData = serviceRows.find(s => s.id === service.service_id);
        if (!serviceData) {
          return res.status(404).json({ success: false, message: `Không tìm thấy dịch vụ ${service.service_id}` });
        }
        if (serviceData.stock < service.quantity) {
          return res.status(400).json({ success: false, message: `Dịch vụ ${service.service_id} chỉ còn ${serviceData.stock}` });
        }
        service_total += serviceData.price * service.quantity;
      }
    }

    // 6. Tính giảm giá
    let discount_amount = 0;
    if (promotion_id) {
      const [promotionRows] = await connection.query(
        'SELECT discount_type, discount_value, min_order, max_discount FROM promotions WHERE id = ?',
        [promotion_id]
      );
      if (promotionRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
      }
      const promotion = promotionRows[0];
      const subtotal = ticket_total + service_total;
      const minOrder = Number(promotion.min_order || 0);
      if (minOrder > 0 && subtotal < minOrder) {
        return res.status(400).json({ success: false, message: `Chưa đạt giá trị tối thiểu ${minOrder}` });
      }
      const type = promotion.discount_type.toLowerCase();
      const value = Number(promotion.discount_value || 0);
      if (type === 'percent') {
        discount_amount = (subtotal * value) / 100;
        const maxDiscount = Number(promotion.max_discount || 0);
        if (maxDiscount > 0) discount_amount = Math.min(discount_amount, maxDiscount);
      } else if (type === 'fixed') {
        discount_amount = value;
      }
      discount_amount = Math.min(discount_amount, subtotal);
      discount_amount = Math.max(0, Math.floor(discount_amount));
    }

    // 7. TÍNH TỔNG TIỀN (ưu tiên clientGrandTotal nếu có)
    const grand_total = clientGrandTotal !== undefined ? Number(clientGrandTotal) : Math.max(0, ticket_total + service_total - discount_amount);

    // TỰ ĐỘNG XÁC NHẬN NẾU MIỄN PHÍ
    const finalStatus = grand_total === 0 ? 'confirmed' : clientStatus;

    // 8. Bắt đầu transaction
    await connection.beginTransaction();

    // 9. Tạo đơn hàng (CÓ THÊM employee_id)
    const [bookingResult] = await connection.query(
      `INSERT INTO orders (
        user_id, employee_id, showtime_id, order_date, status, payment_method, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id || null, employeeId || null, showtime_id, new Date(), finalStatus, payment_method, grand_total]
    );
    const bookingId = bookingResult.insertId;

    // 10. Lưu vé
    for (const seat of seatRows) {
      await connection.query(
        'INSERT INTO orderticket (order_id, showtime_id, seat_id, ticket_price) VALUES (?, ?, ?, ?)',
        [bookingId, showtime_id, seat.seat_id, seat.ticket_price]
      );
    }

    // 11. Lưu dịch vụ + giảm tồn kho
    if (services && services.length > 0) {
      for (const service of services) {
        const [priceRow] = await connection.query('SELECT price FROM services WHERE id = ?', [service.service_id]);
        const price = priceRow[0].price;
        await connection.query(
          'INSERT INTO orderservice (order_id, service_id, quantity, service_price) VALUES (?, ?, ?, ?)',
          [bookingId, service.service_id, service.quantity, price]
        );
        await connection.query('UPDATE services SET quantity = quantity - ? WHERE id = ?', [service.quantity, service.service_id]);
      }
    }

    // 12. CẬP NHẬT GHẾ: booked nếu confirmed, reserved nếu pending
    const seatStatus = finalStatus === 'confirmed' ? 'booked' : 'reserved';
    await connection.query(
      `UPDATE show_seats SET status = ?, reservation_id = ?, updated_at = NOW()
       WHERE showtime_id = ? AND seat_number IN (?)`,
      [seatStatus, bookingId, showtime_id, seatNumbers]
    );

    // 13. Cập nhật khuyến mãi
    if (promotion_id) {
      await connection.query('UPDATE promotions SET used_count = used_count + 1 WHERE id = ?', [promotion_id]);
    }

    // 14. Cộng điểm thành viên
    let pointsAdded = 0;
    if (user_id || phone) {
      let queryParams = [user_id];
      if (!user_id && phone) {
        const [userRows] = await connection.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (userRows.length > 0) queryParams = [userRows[0].id];
        else queryParams = [null];
      }
      if (queryParams[0]) {
        const [memberRows] = await connection.query('SELECT id, points FROM membership_cards WHERE user_id = ?', queryParams);
        if (memberRows.length > 0) {
          pointsAdded = Math.floor(grand_total / 10000); // 1 điểm = 10k
          await connection.query('UPDATE membership_cards SET points = points + ? WHERE id = ?', [100, memberRows[0].id]);
        }
      }
    }

    // 15. Commit
    await connection.commit();

    // 16. GỬI INNGEST
    const events = [
      {
        name: 'booking/created',
        data: {
          order_id: bookingId,
          user_id,
          employee_id: employeeId || null,
          showtime_id,
          tickets,
          services,
          payment_method,
          promotion_id,
          ticket_total,
          service_total,
          discount_amount,
          grand_total,
          status: finalStatus,
          points_added: pointsAdded,
        },
      }
    ];

    // Chỉ gửi checkpayment nếu pending
    if (finalStatus === 'pending') {
      events.push({
        name: 'app/checkpayment',
        data: { order_id: bookingId }
      });
    }

    // Gửi vé ngay nếu confirmed
    if (finalStatus === 'confirmed') {
      events.push({
        name: 'booking/send-ticket',
        data: { order_id: bookingId }
      });
    }

    await inngest.send(events);

    // 17. Trả về
    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: {
        order_id: bookingId,
        user_id,
        employee_id: employeeId || null,
        showtime_id,
        tickets,
        services,
        payment_method,
        promotion_id,
        ticket_total,
        service_total,
        discount_amount,
        grand_total,
        status: finalStatus,
        points_added: pointsAdded,
      },
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    return res.status(500).json({ success: false, message: `Lỗi server: ${error.message}` });
  } finally {
    connection.release();
  }
};
export const getDetailOrder = async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
      const { id } = req.params;
  
      // 1. Kiểm tra order_id
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: "Đơn hàng không hợp lệ" });
      }
  
      // 2. Lấy thông tin đơn hàng từ bảng orders
      const [orderRows] = await connection.query(
        `SELECT order_id, user_id, showtime_id, order_date, status, payment_method
         FROM orders
         WHERE order_id = ?`,
        [id]
      );
  
      if (orderRows.length === 0) {
        return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại" });
      }
  
      const order = orderRows[0];
  
      // 3. Lấy danh sách vé từ bảng orderticket
      const [ticketRows] = await connection.query(
        `SELECT seat_id, ticket_price
         FROM orderticket
         WHERE order_id = ?`,
        [id]
      );
  
      // 4. Lấy danh sách dịch vụ từ bảng orderservice
      const [serviceRows] = await connection.query(
        `SELECT service_id, quantity, service_price
         FROM orderservice
         WHERE order_id = ?`,
        [id]
      );
  
      // 5. Tính toán các giá trị tài chính
      const ticket_total = ticketRows.reduce((sum, ticket) => sum + ticket.ticket_price, 0);
      const service_total = serviceRows.reduce((sum, service) => sum + service.service_price * service.quantity, 0);
  
      // 6. Tính tiền giảm giá dựa trên promotion_id
      let discount_amount = 0;
      if (order.promotion_id) {
        const [promotionRows] = await connection.query(
          `SELECT discount_type, discount_value, min_order, max_discount
           FROM promotions
           WHERE id = ?`,
          [order.promotion_id]
        );
  
        if (promotionRows.length > 0) {
          const promotion = promotionRows[0];
          const subtotal = ticket_total + service_total;
          const minOrder = Number(promotion.min_order || 0);
          if (minOrder === 0 || subtotal >= minOrder) {
            const type = promotion.discount_type.toLowerCase();
            const value = Number(promotion.discount_value || 0);
            if (type === 'percent') {
              discount_amount = (subtotal * value) / 100;
              const maxDiscount = Number(promotion.max_discount || 0);
              if (maxDiscount > 0) {
                discount_amount = Math.min(discount_amount, maxDiscount);
              }
            } else if (type === 'fixed') {
              discount_amount = value;
            }
            discount_amount = Math.min(discount_amount, subtotal);
            discount_amount = Math.max(0, Math.floor(discount_amount));
          }
        }
      }
  
      // 7. Tính tổng tiền hóa đơn
      const grand_total = Math.max(0, ticket_total + service_total - discount_amount);
  
      // 8. Tạo đối tượng tickets và services cho response
      const tickets = ticketRows.map(ticket => ({
        seat_id: ticket.seat_id,
        ticket_price: ticket.ticket_price
      }));
  
      const services = serviceRows.map(service => ({
        service_id: service.service_id,
        quantity: service.quantity,
        service_price: service.service_price
      }));
  
      // 9. Trả về phản hồi
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết đơn hàng thành công",
        data: {
          order_id: order.id,
          user_id: order.user_id,
          showtime_id: order.showtime_id,
          order_date: order.order_date,
          status: order.status,
          payment_method: order.payment_method,
          promotion_id: order.promotion_id || null,
          tickets,
          services,
          ticket_total,
          service_total,
          discount_amount,
          grand_total
        }
      });
    } catch (error) {
      console.error('Error getting order details:', error);
      return res.status(500).json({ success: false, message: `Lỗi server: ${error.message}` });
    } finally {
      connection.release();
    }
  };
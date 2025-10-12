import { Inngest } from 'inngest';
import dbPool from '../config/mysqldb.js'; // Import dbPool để truy vấn MySQL

export const inngest = new Inngest({
  id: 'movie_ticket_app',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY
});

export const ticketCreated = inngest.createFunction(
  { id: 'booking-created' },
  { event: 'booking/created' },
  async ({ event, step }) => {
    await step.run('log-booking', async () => {
      console.log('Booking created:', event.data);
      return { message: `Processed booking ${event.data.order_id}` };
    });
    return { success: true };
  }
);

export const releaseSeatsAndDeleteOrder = inngest.createFunction(
  { id: 'release-seats-delete-booking' },
  { event: 'app/checkpayment' },
  async ({ event, step }) => {
    const { order_id } = event.data;

    // Chờ 15 phút
    const fifteenMinutes = new Date(Date.now() + 5 * 60 * 1000);
    await step.sleepUntil('wait-to-15-minute', fifteenMinutes);

    // Kết nối database
    const connection = await dbPool.getConnection();
    try {
      // Kiểm tra trạng thái thanh toán
      const [orderRows] = await connection.query(
        'SELECT status FROM orders WHERE order_id = ?',
        [order_id]
      );

      if (orderRows.length === 0) {
        return { success: false, message: `Đơn hàng ${order_id} không tồn tại` };
      }

      const order = orderRows[0];

      // Nếu trạng thái vẫn là pending, tiến hành hoàn ghế và xóa đơn hàng
      if (order.status === 'pending') {
        await step.run('release-seats-and-delete-order', async () => {
          // Bắt đầu transaction
          await connection.beginTransaction();

          // 1. Hoàn ghế về trạng thái available
          await connection.query(
            `UPDATE show_seats
             SET status = 'available', reservation_id = NULL, updated_at = NOW()
             WHERE reservation_id = ?`,
            [order_id]
          );

          // 2. Hoàn lại số lượng dịch vụ
          const [serviceRows] = await connection.query(
            'SELECT service_id, quantity FROM orderservice WHERE order_id = ?',
            [order_id]
          );
          for (const service of serviceRows) {
            await connection.query(
              'UPDATE services SET quantity = quantity + ? WHERE id = ?',
              [service.quantity, service.service_id]
            );
          }

          // 3. Hoàn lại lượt sử dụng khuyến mãi
        

          // 4. Xóa bản ghi liên quan
          await connection.query('DELETE FROM orderticket WHERE order_id = ?', [order_id]);
          await connection.query('DELETE FROM orderservice WHERE order_id = ?', [order_id]);
          await connection.query('UPDATE  orders set status ="cancelled" WHERE order_id = ?', [order_id]);

          // Commit transaction
          await connection.commit();

          return { success: true, message: `Đã hoàn ghế và xóa đơn hàng ${order_id}` };
        });
      } else {
        return { success: false, message: `Đơn hàng ${order_id} đã được thanh toán hoặc không ở trạng thái pending` };
      }
    } catch (error) {
      await connection.rollback();
      console.error('Error in releaseSeatsAndDeleteOrder:', error);
      return { success: false, message: `Lỗi: ${error.message}` };
    } finally {
      connection.release();
    }
  }
);

export const functions = [ticketCreated, releaseSeatsAndDeleteOrder];
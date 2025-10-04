import crypto from 'crypto';
import dbPool from "../config/mysqldb.js";
import { log } from 'console';

const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || 'your_sepay_webhook_secret_here';

export const handleSepayWebhook = async (req, res) => {
  try {
    const {
      gateway,
      transactionDate,
      accountNumber,
      subAccount,
      content,
      transferType,
      transferAmount,
      referenceCode,
      id,
      description
    } = req.body;

    // 1. Kiểm tra dữ liệu cơ bản
    if (!content || !transferAmount || !referenceCode || !transactionDate) {
      console.error('Webhook data incomplete:', req.body);
      return res.status(400).json({ success: false, message: "Dữ liệu webhook không đầy đủ" });
    }

    // 2. Parse order_id từ content hoặc description
    let order_id;
    const contentStr = (content || description || '').trim();
    if (contentStr) {
      // Split bằng khoảng trắng hoặc ký tự đặc biệt
      const contentParts = contentStr.split(/[\s\/-]+/);
      // Tìm số cuối cùng trong chuỗi, giả định là order_id (ví dụ: '3' trong '1 3-')
      const numberParts = contentParts.filter(part => /^\d+$/.test(part));
      if (numberParts.length >= 2) {
        order_id = numberParts[numberParts.length - 1]; // Lấy số thứ 2 từ cuối (3 trong '1 3-')
      }
    }

    if (!order_id) {
      console.error('Cannot parse order_id from content:', contentStr);
      return res.status(400).json({ success: false, message: "Không thể parse order_id từ content" });
    }

    // 3. Ánh xạ các trường
    const transaction_id = referenceCode || id;
    const amount = transferAmount;
    const timestamp = new Date(transactionDate).getTime() / 1000;
    const status = transferType === 'in' ? 'success' : 'failed'; // Giả định 'in' là success
    const payment_method = gateway || 'qr_code';

    // 4. Xác thực signature (nếu có trong header)
    const signature = req.headers['x-signature'] || ''; // Kiểm tra header
    if (SEPAY_WEBHOOK_SECRET && signature) {
      const rawData = `${transaction_id}${order_id}${status}${amount}${payment_method}${timestamp}`;
      const computedSignature = crypto
        .createHmac('sha256', SEPAY_WEBHOOK_SECRET)
        .update(rawData)
        .digest('hex');

      if (computedSignature !== signature) {
        console.error('Webhook signature mismatch:', { received: signature, computed: computedSignature });
        return res.status(401).json({ success: false, message: "Signature không hợp lệ" });
      }
    } else {
      console.warn('No signature provided or SEPAY_WEBHOOK_SECRET not set');
    }

    // 5. Lấy kết nối DB
    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
      // 6. Kiểm tra đơn hàng tồn tại
      const [orderRows] = await connection.query(
        'SELECT order_id, status, total_amount FROM orders WHERE order_id = ?',
        [order_id]
      );
            console.log(order_id)
      if (orderRows.length === 0) {
        await connection.rollback();
        console.error('Order not found:', order_id);
        return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại" });
      }

      const order = orderRows[0];

      // 7. Kiểm tra trạng thái và số tiền
      if (order.status !== 'pending') {
        console.warn('Webhook ignored: Order already processed', { order_id, current_status: order.status });
        await connection.commit();
        return res.status(200).json({ success: true, message: "Webhook đã xử lý trước đó" });
      }

      if (Number(order.total_amount) !== Number(amount)) {
        await connection.rollback();
        console.error('Webhook amount mismatch:', { order_id, db_amount: order.total_amout, webhook_amount: amount });
        return res.status(400).json({ success: false, message: "Số tiền không khớp" });
      }

      // 8. Xử lý trạng thái giao dịch
      if (status === 'success') {
        await connection.query(
          'UPDATE orders SET status = "confirmed", updated_at = NOW() WHERE order_id = ?',
          [order_id]
        );
        await connection.query(
          'UPDATE show_seats SET status = "booked", reservation_id = NULL, updated_at = NOW() WHERE reservation_id = ?',
          [order_id]
        );
        console.log(`Payment confirmed for order ${order_id}, amount: ${amount}`);
      } else {
        await connection.query(
          'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE order_id = ?',
          [order_id]
        );
        await connection.query(
          'UPDATE show_seats SET status = "available", reservation_id = NULL, updated_at = NOW() WHERE reservation_id = ?',
          [order_id]
        );
        console.log(`Payment failed for order ${order_id}`);
      }

      // 9. Commit transaction
      await connection.commit();
      return res.status(200).json({ success: true, message: `Webhook xử lý thành công: ${status}` });
    } catch (dbError) {
      await connection.rollback();
      console.error('DB error in webhook:', dbError);
      return res.status(500).json({ success: false, message: `Lỗi xử lý webhook: ${dbError.message}` });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false, message: `Lỗi server webhook: ${error.message}` });
  }
};
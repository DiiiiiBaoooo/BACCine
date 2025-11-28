import crypto from 'crypto';
import dbPool from "../config/mysqldb.js";
import { log } from 'console';
import transporter from "../services/mail.js";
import QRCode from 'qrcode'; // THÊM IMPORT QRCode
const SEPAY_WEBHOOK_SECRET2 = process.env.SEPAY_WEBHOOK_SECRET2 || 'your_sepay_webhook_secret_here';
const SEPAY_WEBHOOK_SECRET3= process.env.SEPAY_WEBHOOK_SECRET3 || 'your_sepay_webhook_secret_here';

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
      const contentParts = contentStr.split(/[\s\/-]+/);
      const numberParts = contentParts.filter(part => /^\d+$/.test(part));
      if (numberParts.length >= 2) {
        order_id = numberParts[numberParts.length - 1];
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
    const status = transferType === 'in' ? 'success' : 'failed';
    const payment_method = gateway || 'qr_code';

    // 4. Xác thực signature
    const signature = req.headers['x-signature'] || '';
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
      console.log(order_id);
      
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
        console.error('Webhook amount mismatch:', { order_id, db_amount: order.total_amount, webhook_amount: amount });
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

        // ================== GỬI EMAIL HÓA ĐƠN VÉ XEM PHIM VỚI QR CODE ==================
        try {
          // Lấy thông tin chi tiết đơn hàng
          const [detailedOrder] = await connection.query(`
            SELECT 
              o.order_id,
              o.total_amount,
              u.email,
              u.name,
              u.phone,
              m.title AS movie_title,
              m.runtime AS duration,
              s.start_time,
              DATE(s.start_time) AS show_date,
              TIME_FORMAT(s.start_time, '%H:%i') AS show_time,
              r.name AS room_name,
              cc.name AS cinema_name,
              cc.address AS cinema_address,
              GROUP_CONCAT(DISTINCT ss.seat_number ORDER BY ss.seat_number SEPARATOR ', ') AS seats,
              GROUP_CONCAT(DISTINCT CONCAT(st.name, ' (', ss.seat_number, ')') ORDER BY ss.seat_number SEPARATOR ', ') AS seat_details
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN showtimes s ON o.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN rooms r ON s.room_id = r.id
            JOIN cinema_clusters cc ON r.cinema_clusters_id = cc.id
            JOIN orderticket ot ON o.order_id = ot.order_id
            JOIN show_seats ss ON ot.seat_id = ss.seat_id
            JOIN seat_types st ON ss.seat_type_id = st.id
            WHERE o.order_id = ?
            GROUP BY o.order_id, o.total_amount, u.email, u.name, u.phone, 
                     m.title, m.runtime, s.start_time, r.name, cc.name, cc.address;
          `, [order_id]);

          if (detailedOrder.length === 0) {
            console.warn('Không lấy được thông tin chi tiết đơn hàng để gửi email:', order_id);
          } else {
            const orderDetail = detailedOrder[0];
            log(orderDetail);

            // ⭐ TẠO QR CODE (dạng Buffer để gửi attachment)
            const validationUrl = `https://bac-cine.vercel.app/inve/${orderDetail.order_id}`;
            const qrBuffer = await QRCode.toBuffer(validationUrl, {
              errorCorrectionLevel: 'H',
              type: 'png',
              quality: 0.92,
              margin: 1,
              width: 300,
              color: {
                dark: '#000000FF',
                light: '#FFFFFFFF',
              },
            });

            // Tạo nội dung email đẹp với QR Code
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                  <h1>🎬 BAC Cinema - Vé xem phim của bạn</h1>
                </div>
                <div style="padding: 20px;">
                  <h2 style="color: #e74c3c;"> Thanh toán thành công!</h2>
                  <p>Xin chào <strong>${orderDetail.name || 'Quý khách'}</strong>,</p>
                  <p>Cảm ơn bạn đã đặt vé tại hệ thống của chúng tôi. Dưới đây là thông tin vé xem phim:</p>

                  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Mã đơn hàng:</strong> #${orderDetail.order_id}</p>
                    <p><strong>Phim:</strong> ${orderDetail.movie_title} (${orderDetail.duration} phút)</p>
                    <p><strong>Ngày chiếu:</strong> ${new Date(orderDetail.show_date).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Giờ chiếu:</strong> ${orderDetail.show_time}</p>
                    <p><strong>Rạp:</strong> ${orderDetail.cinema_name}</p>
                    <p><strong>Địa chỉ:</strong> ${orderDetail.cinema_address}</p>
                    <p><strong>Phòng chiếu:</strong> ${orderDetail.room_name}</p>
                    <p><strong>Ghế đã chọn:</strong> <span style="color: #e74c3c; font-weight: bold;">${orderDetail.seats}</span></p>
                    <p><strong>Tổng tiền:</strong> <strong style="color: #27ae60;">${Number(orderDetail.total_amount).toLocaleString('vi-VN')} VNĐ</strong></p>
                  </div>

                  <!-- QR CODE -->
                  <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff; border: 2px dashed #e74c3c; border-radius: 10px;">
                    <h3 style="color: #e74c3c; margin-bottom: 15px;">🎫 Mã QR Code của bạn</h3>
                    <img src="cid:qrcode@ticket" alt="QR Code" style="width: 250px; height: 250px; margin: 0 auto; display: block;" />
                    <p style="margin-top: 15px; color: #666; font-size: 14px;">
                      Vui lòng xuất trình mã QR này tại quầy để nhận vé
                    </p>
                  </div>

                  <p><strong>📋 Hướng dẫn:</strong></p>
                  <ul style="line-height: 1.8;">
                    <li>Vui lòng đến trước giờ chiếu ít nhất <strong>15 phút</strong> để check-in.</li>
                    <li>Mang theo <strong>mã QR code này</strong> hoặc mã đơn hàng để nhân viên hỗ trợ.</li>
                    <li>Không hoàn vé sau khi thanh toán thành công.</li>
                    <li>Liên hệ hotline nếu cần hỗ trợ: <strong>1900-xxxx</strong></li>
                  </ul>

                  <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
                  <p style="color: #777; font-size: 12px; text-align: center;">
                    Đây là email tự động, vui lòng không trả lời.<br/>
                    Nếu cần hỗ trợ, liên hệ: support@cgvclone.vn
                  </p>
                </div>
              </div>
            `;

            // Gửi email với QR code dạng inline attachment
            await transporter.sendMail({
              from: `"BAC Cinema" <${process.env.GOOGLE_USER}>`,
              to: orderDetail.email,
              subject: `🎬 Vé xem phim  ${orderDetail.movie_title} đã được xác nhận!`,
              html: emailHtml,
              attachments: [
                {
                  filename: `ticket-qr-${orderDetail.order_id}.png`,
                  content: qrBuffer,
                  cid: 'qrcode@ticket' // Content-ID để nhúng vào HTML
                }
              ]
            });

            console.log(`✅ Đã gửi email hóa đơn kèm QR code thành công đến ${orderDetail.email} cho đơn hàng ${order_id}`);
          }
        } catch (emailError) {
          console.error('❌ Lỗi khi gửi email hóa đơn:', emailError);
        }
        // =====================================================================
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
export const handleVideoPurchaseWebhook = async (req, res) => {
  try {
    const {
      gateway,
      transactionDate,
      accountNumber,
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
const signature = req.headers['x-signature'] || '';
    if (SEPAY_WEBHOOK_SECRET2 && signature) {
      const rawData = `${transaction_id}${order_id}${status}${amount}${payment_method}${timestamp}`;
      const computedSignature = crypto
        .createHmac('sha256', SEPAY_WEBHOOK_SECRET2)
        .update(rawData)
        .digest('hex');

      if (computedSignature !== signature) {
        console.error('Webhook signature mismatch:', { received: signature, computed: computedSignature });
        return res.status(401).json({ success: false, message: "Signature không hợp lệ" });
      }
    } else {
      console.warn('No signature provided or SEPAY_WEBHOOK_SECRET not set');
    }
    // 2. Parse purchase_id từ content
    let purchase_id;
    const contentStr = (content || description || '').trim();
    if (contentStr) {
      const contentParts = contentStr.split(/[\s\/-]+/);
      const numberParts = contentParts.filter(part => /^\d+$/.test(part));
      if (numberParts.length >= 1) {
        purchase_id = numberParts[numberParts.length - 1];
      }
    }

    if (!purchase_id) {
      console.error('Cannot parse purchase_id from content:', contentStr);
      return res.status(400).json({ success: false, message: "Không thể parse purchase_id từ content" });
    }

    const amount = transferAmount;
    const transaction_status = transferType === 'in' ? 'completed' : 'failed';

    console.log('📩 Video Purchase Webhook:', { purchase_id, amount, transaction_status });

    // 3. Kiểm tra purchase tồn tại
    const [purchaseRows] = await dbPool.query(
      'SELECT * FROM video_purchases WHERE purchase_id = ?',
      [purchase_id]
    );

    if (purchaseRows.length === 0) {
      console.error('Purchase not found:', purchase_id);
      return res.status(404).json({ success: false, message: "Giao dịch không tồn tại" });
    }

    const purchase = purchaseRows[0];

    // 4. Kiểm tra trạng thái và số tiền
    if (purchase.status !== 'pending') {
      console.warn('Webhook ignored: Purchase already processed', { purchase_id, current_status: purchase.status });
      return res.status(200).json({ success: true, message: "Webhook đã xử lý trước đó" });
    }

    if (Number(purchase.price_paid) !== Number(amount)) {
      console.error('Webhook amount mismatch:', { purchase_id, db_amount: purchase.price_paid, webhook_amount: amount });
      return res.status(400).json({ success: false, message: "Số tiền không khớp" });
    }

    // 5. Cập nhật trạng thái purchase
    if (transaction_status === 'completed') {
      await dbPool.query(
        'UPDATE video_purchases SET status = "completed", transaction_id = ? WHERE purchase_id = ?',
        [referenceCode, purchase_id]
      );
      console.log(`✅ Video purchase confirmed: ${purchase_id}, amount: ${amount}`);
    } else {
      await dbPool.query(
        'UPDATE video_purchases SET status = "failed" WHERE purchase_id = ?',
        [purchase_id]
      );
      console.log(`❌ Video purchase failed: ${purchase_id}`);
    }

    return res.status(200).json({ success: true, message: `Webhook xử lý thành công: ${transaction_status}` });

  } catch (error) {
    console.error('Video Purchase Webhook error:', error);
    return res.status(500).json({ success: false, message: `Lỗi server webhook: ${error.message}` });
  }
};


export const handleEventPaymentWebhook = async (req, res) => {
  try {
    const {
      gateway,
      transactionDate,
      content,
      transferType,
      transferAmount,
      referenceCode,
      id,
      description
    } = req.body;

    console.log('📩 Received Event Payment Webhook:', {
      content,
      transferAmount,
      transferType,
      referenceCode,
      transactionDate
    });

    // 1. Xác thực signature (nếu có)
    const signature = req.headers['x-signature'] || '';
    if (SEPAY_WEBHOOK_SECRET3 && signature) {
      // ⚠️ Cần điều chỉnh rawData theo format thực tế của SePay
      const rawData = JSON.stringify(req.body);
      const computedSignature = crypto
        .createHmac('sha256', SEPAY_WEBHOOK_SECRET3)
        .update(rawData)
        .digest('hex');

      if (computedSignature !== signature) {
        console.error('❌ Webhook signature mismatch');
        return res.status(401).json({ 
          success: false, 
          message: "Signature không hợp lệ" 
        });
      }
    }

    // 2. Kiểm tra dữ liệu cơ bản
    if (!content && !description) {
      console.error('❌ Missing content/description');
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu nội dung chuyển khoản" 
      });
    }

    if (!transferAmount) {
      console.error('❌ Missing transferAmount');
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu số tiền" 
      });
    }

    // 3. Parse event_id từ content
  let event_id = null;
const contentStr = content.toString().trim();

// Cách 1: Ưu tiên tìm EVENTPAYxxx hoặc EventPay xxx
const eventMatch = contentStr.match(/EVENTPAY[\s\/-]*(\d+)/i);
if (eventMatch) {
  event_id = eventMatch[1];
} else {
  // Cách 2: Tìm tất cả các số trong nội dung, rồi xác định số nào là mã sự kiện
  const numbers = contentStr.match(/\d+/g); // lấy mảng tất cả số

  if (numbers && numbers.length >= 4) {
    // Trong format phổ biến của bạn: "tên SEPAYxxxx X mã_sự_kiện - ..."
    // → mã sự kiện thường là số thứ 4 trong tin nhắn
    // Ví dụ: Qafohr2810 SEPAY6313 1 5- Ma GD... → numbers = ['2810','6313','1','5']
    event_id = numbers[3]; // chính là "5"
  } else if (numbers && numbers.length >= 1) {
    // Nếu không đủ 4 số → fallback cũ: lấy số đầu tiên (cũ)
    event_id = numbers[0];
  }
}

    if (!event_id) {
      console.error('❌ Cannot parse event_id from content:', contentStr);
      return res.status(400).json({ 
        success: false, 
        message: "Không thể xác định mã yêu cầu từ nội dung chuyển khoản" 
      });
    }

    const amount = Number(transferAmount);
    const transaction_status = transferType === 'in' ? 'completed' : 'failed';

    console.log('✅ Parsed webhook data:', { 
      event_id, 
      amount, 
      transaction_status 
    });

    // 4. Kiểm tra event request tồn tại
    const [eventRows] = await dbPool.query(
      'SELECT id, status, quoted_price, user_id FROM event_requests WHERE id = ?',
      [event_id]
    );

    if (eventRows.length === 0) {
      console.error('❌ Event request not found:', event_id);
      return res.status(404).json({ 
        success: false, 
        message: "Yêu cầu sự kiện không tồn tại" 
      });
    }

    const eventRequest = eventRows[0];

    // 5. Kiểm tra trạng thái - CHỈ XỬ LÝ KHI STATUS = 'quoted'
    if (eventRequest.status !== 'quoted') {
      console.warn('⚠️ Webhook ignored: Event already processed', { 
        event_id, 
        current_status: eventRequest.status 
      });
      return res.status(200).json({ 
        success: true, 
        message: "Yêu cầu đã được xử lý trước đó" 
      });
    }

    // 6. Kiểm tra số tiền
    const quotedPrice = Number(eventRequest.quoted_price);
    if (quotedPrice !== amount) {
      console.error('❌ Amount mismatch:', { 
        event_id, 
        expected: quotedPrice, 
        received: amount 
      });
      return res.status(400).json({ 
        success: false, 
        message: `Số tiền không khớp (Yêu cầu: ${quotedPrice.toLocaleString('vi-VN')}đ, Nhận: ${amount.toLocaleString('vi-VN')}đ)` 
      });
    }

    // 7. Xử lý thanh toán
    if (transaction_status === 'completed') {
      // ✅ THANH TOÁN THÀNH CÔNG
      console.log(`✅ Payment confirmed for event ${event_id}, processing...`);

      // Cập nhật trạng thái trước khi gọi acceptQuote
      await dbPool.query(
        'UPDATE event_requests SET status = "quoted", updated_at = NOW() WHERE id = ?',
        [event_id]
      );

      // Tạo mock request để gọi acceptQuote
      const mockReq = {
        params: { id: event_id },
        user: { id: eventRequest.user_id }
      };

      let acceptSuccess = false;
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            acceptSuccess = (code >= 200 && code < 300);
            if (acceptSuccess) {
              console.log(`✅ Showtime created successfully for event ${event_id}`);
            } else {
              console.error(`❌ Failed to create showtime for event ${event_id}:`, data);
            }
            return data;
          }
        }),
        json: (data) => {
          acceptSuccess = true;
          console.log(`✅ acceptQuote response:`, data);
          return data;
        }
      };
      try {
        // Gọi acceptQuote
        const { acceptQuote } = await import('./EventRequest.js');
        console.log(mockReq);
        log(mockRes);
        
        await acceptQuote(mockReq, mockRes);

        if (acceptSuccess) {
          // Gửi email xác nhận
          await sendEventConfirmationEmail(event_id);
        }
      } catch (acceptError) {
        console.error('❌ Error calling acceptQuote:', acceptError);
        // Rollback status về quoted nếu acceptQuote thất bại
        await dbPool.query(
          'UPDATE event_requests SET status = "quoted", updated_at = NOW() WHERE id = ?',
          [event_id]
        );
      }

    } else {
      // ❌ THANH TOÁN THẤT BẠI (transferType !== 'in')
      console.log(`❌ Payment failed for event ${event_id}`);

      await dbPool.query(
        'UPDATE event_requests SET status = "quoted", updated_at = NOW() WHERE id = ?',
        [event_id]
      );

      await dbPool.query(
        `INSERT INTO event_request_history 
         (event_request_id, old_status, new_status, changed_by, note)
         VALUES (?, 'payment_pending', 'quoted', ?, 'Thanh toán thất bại')`,
        [event_id, eventRequest.user_id]
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: `Webhook xử lý thành công: ${transaction_status}`,
      event_id
    });

  } catch (error) {
    console.error('❌ Event Payment Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Lỗi server: ${error.message}` 
    });
  }
};

// Helper function: Gửi email xác nhận
async function sendEventConfirmationEmail(event_id) {
  try {
    const [eventDetail] = await dbPool.query(
      'SELECT * FROM event_requests_detail WHERE id = ?',
      [event_id]
    );

    if (eventDetail.length === 0) {
      console.warn('⚠️ Event detail not found for email:', event_id);
      return;
    }

    const detail = eventDetail[0];
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background: #e74c3c; color: #fff; padding: 20px; text-align: center;">
          <h1>🎬 BAC Cinema - Xác nhận suất chiếu riêng</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #27ae60;">✅ Thanh toán thành công!</h2>
          <p>Xin chào <strong>${detail.contact_name}</strong>,</p>
          <p>Cảm ơn bạn đã đặt suất chiếu riêng tại BAC Cinema. Đơn hàng của bạn đã được xác nhận.</p>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Mã yêu cầu:</strong> #${detail.id}</p>
            <p><strong>Phim:</strong> ${detail.movie_title}</p>
            <p><strong>Ngày chiếu:</strong> ${new Date(detail.event_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Giờ chiếu:</strong> ${detail.start_time}</p>
            <p><strong>Rạp:</strong> ${detail.cinema_name}</p>
            <p><strong>Số khách:</strong> ${detail.guest_count} người</p>
            <p><strong>Tổng tiền:</strong> <strong style="color: #27ae60;">${Number(detail.quoted_price).toLocaleString('vi-VN')} VNĐ</strong></p>
          </div>

          <p><strong>📋 Hướng dẫn:</strong></p>
          <ul style="line-height: 1.8;">
            <li>Vui lòng đến trước giờ chiếu ít nhất <strong>30 phút</strong> để chuẩn bị.</li>
            <li>Mang theo mã yêu cầu <strong>#${detail.id}</strong> để check-in.</li>
            <li>Liên hệ hotline nếu cần hỗ trợ: <strong>1900-1234</strong></li>
          </ul>

          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="color: #777; font-size: 12px; text-align: center;">
            Đây là email tự động, vui lòng không trả lời.<br/>
            Liên hệ: support@baccinema.vn
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"BAC Cinema" <${process.env.GOOGLE_USER}>`,
      to: detail.contact_email,
      subject: `✅ Xác nhận suất chiếu riêng - ${detail.movie_title}`,
      html: emailHtml
    });

    console.log(`✅ Confirmation email sent to ${detail.contact_email}`);
  } catch (emailError) {
    console.error('❌ Error sending email:', emailError);
  }
}
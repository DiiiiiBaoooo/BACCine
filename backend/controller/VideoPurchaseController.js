import dbPool from "../config/mysqldb.js";

// Kiểm tra quyền xem video (không dùng stored procedure)
export const checkVideoAccess = async (req, res) => {
  const { video_id } = req.params;
  const userId = req.user.id;

  try {
    // Kiểm tra video có tồn tại không
    const [videoRows] = await dbPool.query(
      `SELECT video_id, is_free FROM video_library WHERE video_id = ?`,
      [video_id]
    );

    if (videoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video không tồn tại",
      });
    }

    const video = videoRows[0];

    // Nếu video miễn phí
    if (video.is_free === 1) {
      return res.json({
        success: true,
        has_access: true,
        message: "Video miễn phí",
      });
    }

    // Kiểm tra đã mua/thuê chưa
    const [purchaseRows] = await dbPool.query(
      `SELECT 
        purchase_id, 
        purchase_type,
        expiry_date
       FROM video_purchases
       WHERE user_id = ? AND video_id = ? AND status = 'completed'
       AND (expiry_date IS NULL OR expiry_date > NOW())
       LIMIT 1`,
      [userId, video_id]
    );

    if (purchaseRows.length > 0) {
      const purchase = purchaseRows[0];
      const message = purchase.expiry_date 
        ? `Thuê đến: ${new Date(purchase.expiry_date).toLocaleDateString('vi-VN')}`
        : 'Đã mua vĩnh viễn';
      
      return res.json({
        success: true,
        has_access: true,
        message: message,
        purchase_info: purchase,
      });
    }

    // Chưa mua
    res.json({
      success: true,
      has_access: false,
      message: "Chưa mua video này",
    });
  } catch (error) {
    console.error("❌ Error checking video access:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra quyền truy cập",
    });
  }
};

// Lấy thông tin video với trạng thái mua
export const getVideoWithPurchaseStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Lấy thông tin video
    const [videoRows] = await dbPool.query(
      `SELECT * FROM video_library WHERE video_id = ?`,
      [id]
    );

    if (videoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video không tồn tại",
      });
    }

    const video = videoRows[0];

    // Nếu user đã đăng nhập, kiểm tra trạng thái mua
    if (userId) {
      const [purchaseRows] = await dbPool.query(
        `SELECT 
          purchase_id,
          purchase_type,
          purchase_date,
          expiry_date,
          status,
          CASE 
            WHEN expiry_date IS NULL THEN 1
            WHEN expiry_date > NOW() THEN 1
            ELSE 0
          END as is_active
        FROM video_purchases
        WHERE user_id = ? AND video_id = ? AND status = 'completed'
        ORDER BY purchase_date DESC
        LIMIT 1`,
        [userId, id]
      );

      video.purchase_info = purchaseRows[0] || null;
      video.has_access = video.is_free === 1 || (purchaseRows[0]?.is_active === 1);
    } else {
      video.has_access = video.is_free === 1;
      video.purchase_info = null;
    }

    res.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("❌ Error getting video:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin video",
    });
  }
};

// Mua/Thuê video
export const purchaseVideo = async (req, res) => {
  const { video_id, purchase_type, payment_method, transaction_id } = req.body;
  const userId = req.user.id;

  try {
    // Kiểm tra video tồn tại
    const [videoRows] = await dbPool.query(
      `SELECT * FROM video_library WHERE video_id = ?`,
      [video_id]
    );

    if (videoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video không tồn tại",
      });
    }

    const video = videoRows[0];

    // Kiểm tra đã mua chưa
    const [existingPurchase] = await dbPool.query(
      `SELECT * FROM video_purchases 
       WHERE user_id = ? AND video_id = ? 
       AND status = 'completed'
       AND (expiry_date IS NULL OR expiry_date > NOW())`,
      [userId, video_id]
    );

    if (existingPurchase.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã mua/thuê video này rồi",
      });
    }

    // Tính expiry_date
    let expiryDate = null;
    if (purchase_type === 'rent' && video.rental_duration) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + video.rental_duration);
      expiryDate = expiry;
    }

    // Tạo purchase record
    const [result] = await dbPool.query(
      `INSERT INTO video_purchases 
       (user_id, video_id, purchase_type, price_paid, expiry_date, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [userId, video_id, purchase_type, video.price, expiryDate, payment_method, transaction_id]
    );

    res.json({
      success: true,
      message: purchase_type === 'buy' ? 'Mua video thành công' : 'Thuê video thành công',
      purchase_id: result.insertId,
      expiry_date: expiryDate,
    });
  } catch (error) {
    console.error("❌ Error purchasing video:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi mua video",
    });
  }
};

// Lấy danh sách video đã mua
export const getMyPurchasedVideos = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await dbPool.query(
      `SELECT 
        vl.*,
        vp.purchase_id,
        vp.purchase_type,
        vp.purchase_date,
        vp.expiry_date,
        vp.price_paid,
        vp.status,
        CASE 
          WHEN vp.expiry_date IS NULL THEN 1
          WHEN vp.expiry_date > NOW() THEN 1
          ELSE 0
        END as is_active,
        vh.last_position,
        vh.watch_duration
      FROM video_purchases vp
      JOIN video_library vl ON vp.video_id = vl.video_id
      LEFT JOIN video_watch_history vh ON vp.user_id = vh.user_id AND vp.video_id = vh.video_id
      WHERE vp.user_id = ? AND vp.status = 'completed'
      ORDER BY vp.purchase_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: rows.length,
      videos: rows,
    });
  } catch (error) {
    console.error("❌ Error getting purchased videos:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách video đã mua",
    });
  }
};

// Lưu tiến độ xem video
export const saveWatchProgress = async (req, res) => {
  const { video_id, last_position, watch_duration } = req.body;
  const userId = req.user.id;

  try {
    await dbPool.query(
      `INSERT INTO video_watch_history (user_id, video_id, last_position, watch_duration)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         last_position = VALUES(last_position),
         watch_duration = VALUES(watch_duration),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, video_id, last_position, watch_duration]
    );

    res.json({
      success: true,
      message: "Đã lưu tiến độ xem",
    });
  } catch (error) {
    console.error("❌ Error saving watch progress:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu tiến độ xem",
    });
  }
};

// Lấy tất cả video (cho trang thư viện)
export const getAllVideosWithAccess = async (req, res) => {
  const userId = req.user?.id;

  try {
    let query;
    let params = [];

    if (userId) {
      // User đã đăng nhập - hiển thị trạng thái mua
      query = `
        SELECT 
          vl.*,
          vp.purchase_id,
          vp.purchase_type,
          CASE 
            WHEN vl.is_free = 1 THEN 1
            WHEN vp.purchase_id IS NOT NULL AND (
              vp.expiry_date IS NULL OR vp.expiry_date > NOW()
            ) AND vp.status = 'completed' THEN 1
            ELSE 0
          END as has_access
        FROM video_library vl
        LEFT JOIN video_purchases vp ON vl.video_id = vp.video_id 
          AND vp.user_id = ? 
          AND vp.status = 'completed'
        ORDER BY vl.created_at DESC
      `;
      params = [userId];
    } else {
      // Chưa đăng nhập - chỉ hiển thị thông tin cơ bản
      query = `
        SELECT 
          *,
          is_free as has_access
        FROM video_library
        ORDER BY created_at DESC
      `;
    }

    const [rows] = await dbPool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      videos: rows,
    });
  } catch (error) {
    console.error("❌ Error getting videos:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách video",
    });
  }
};
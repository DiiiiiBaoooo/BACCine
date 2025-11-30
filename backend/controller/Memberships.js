import dbPool from "../config/mysqldb.js";

export const getAllMembershipTiers = async (req,res) => {
    try {
        const [rows] = await dbPool.query("SELECT * FROM membership_tiers");
        res.status(200).json({success:true, membershiptiers:rows})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
}


export const addMembershipTier = async(req,res) =>{
    try {
        const {minPoints,nameTier,benefits } = req.body;
        if(!minPoints || !nameTier || !benefits){
            res.status(400).json({ success:false,message:"Chua nhap du thong tin the" });

        }
        const [result] = await dbPool.execute(
            `INSERT INTO membership_tiers (name, min_points, benefits) 
             VALUES (?, ?, ?)`,
            [nameTier, minPoints, benefits]
          );
            // Emit realtime cho tất cả client
    global._io.emit("membershiptiers_update", {
        action: "add",
        tier: {
          id: result.insertId,
          name: nameTier,
          min_points: minPoints,
          benefits,
        },
      });
          res.status(200).json({ success: true, message: "Thêm tier thành công", id: result.insertId });


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateMembershipTier = async (req,res) => {
    try {
        const { id } = req.params;
        const { min_points, benefits } = req.body;
        await dbPool.execute(
            `UPDATE membership_tiers 
             SET min_points=?, benefits=?
             WHERE id=?`,
            [min_points, benefits, id]
          );
          global._io.emit("membershiptiers_update", {
            action: "update",
            tier: { id, min_points, benefits },
          });
          res.status(200).json({ success: true, message: "Cập nhật tier thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
    
}
export const deleteTier = async (req, res) => {
    try {
      const { id } = req.params;
      await dbPool.query("DELETE FROM membership_tiers WHERE id=?", [id]);
      global._io.emit("membershiptiers_update", {
        action: "delete",
        id,
      });
      res.status(200).json({ success: true, message: "Xóa tier thành công" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  export const getMembership = async (req, res) => {
    try {
      const { user_id } = req.params;
      const [rows] = await dbPool.query(
        "SELECT * FROM membership_cards mc join membership_tiers mt  on mt.id=mc.tier_id WHERE user_id = ?",
        [user_id]
      );
  
      if (rows.length <= 0) {
        return res.status(404).json({
          success: false,
          message: "Bạn chưa có thẻ thành viên!",
        });
      }
  
      return res.status(200).json({
        success: true,
        membership: rows,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  export const registerMembership = async (req,res) => {
    try {
      const {user_id}= req.params;
      const [result]= await dbPool.query('INSERT INTO membership_cards (`user_id`,`points`,`tier_id`,`issued_at`) VALUES(?,?,?,?)',[user_id,0,1,new Date()])
      res.status(200).json({ success: true, message: "Thêm tier thành công", id: result.insertId });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });

    }
    
  }
  // === THÊM VÀO CUỐI FILE CONTROLLER ===

/**
 * API: Quay thưởng - Tốn 5000 điểm
 * POST /api/fortune/spin/:user_id
 */
export const spinFortune = async (req, res) => {
  const { user_id } = req.params
  const { reward, type } = req.body

  const connection = await dbPool.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Kiểm tra người dùng và điểm
    const [membership_cards] = await connection.query(
      'SELECT points FROM membership_cards WHERE user_id = ?',
      [user_id]
    )

    if (membership_cards.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: 'Người dùng chưa có thẻ thành viên',
      })
    }

    const membership_card = membership_cards[0]
    if (membership_card.points < 5000) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'Không đủ 5.000 điểm để quay!',
      })
    }

    // 2. Trừ điểm
    await connection.query(
      'UPDATE membership_cards SET points = points - 5000 WHERE user_id = ?',
      [user_id]
    )

    // 3. Xử lý phần thưởng: xác định discount_type, discount_value, expiresAt
    let voucherCode = null
    let expiresAt = null
    let discountType = null
    let discountValue = null

    if (type === 'voucher') {
      voucherCode = 'BAC' + Math.random().toString(36).substring(2, 8).toUpperCase()

      // Xác định loại giảm giá
      if (reward.includes('%')) {
        discountType = 'percent'
        const percentMatch = reward.match(/(\d+)%/)
        discountValue = percentMatch ? parseInt(percentMatch[1], 10) : 0
      } else if (reward.includes('K')) {
        discountType = 'fixed'
        const fixedMatch = reward.match(/(\d+)K/)
        discountValue = (fixedMatch ? parseInt(fixedMatch[1], 10) : 0) * 1000
      } else if (reward === 'Vé miễn phí') {
        discountType = 'percent'
        discountValue = 100 // Giảm 100% = miễn phí
      }

      // Tính hạn dùng
      let days = 7
      if (reward.includes('20%')) days = 10
      else if (reward.includes('30%')) days = 14
      else if (reward.includes('50K') || reward.includes('100K') || reward.includes('15K') || reward.includes('25K')) days = 30
      else if (reward === 'Vé miễn phí') days = 7 // hoặc tùy chỉnh

      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
    }

    // 4. Lưu vào bảng gift với đầy đủ thông tin
    const [giftResult] = await connection.query(
      `INSERT INTO gift 
       (user_id, reward, reward_type, points_spent, voucher_code, 
        discount_type, discount_value, expires_at, used, created_at) 
       VALUES (?, ?, ?, 5000, ?, ?, ?, ?, 0, NOW())`,
      [
        user_id,
        reward,
        type,
        voucherCode,
        discountType,
        discountValue,
        expiresAt,
      ]
    )

    await connection.commit()

    // 5. Lấy điểm mới
    const [[{ points: newPoints }]] = await connection.query(
      'SELECT points FROM membership_cards WHERE user_id = ?',
      [user_id]
    )

    // 6. Phát sự kiện realtime
    const resultPayload = {
      success: true,
      reward,
      voucherCode,
      newPoints,
      giftId: giftResult.insertId,
      discountType,
      discountValue,
      expiresAt,
    }

    global._io.to(`membership_card_${user_id}`).emit('fortune_spin_result', resultPayload)
    global._io.emit('membership_card_points_update', {
      user_id,
      points: newPoints,
    })

    // 7. Trả về cho frontend
    res.status(200).json(resultPayload)
  } catch (error) {
    await connection.rollback()
    console.error('Spin error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống, vui lòng thử lại!',
    })
  } finally {
    connection.release()
  }
}
/**
 * API: Lấy lịch sử quay thưởng
 * GET /api/fortune/history/:user_id
 */
export const getFortuneHistory = async (req, res) => {
  const { user_id } = req.params
  try {
    const [rows] = await dbPool.query(
      `SELECT 
          id,
          reward,
          reward_type,
          voucher_code,
          created_at,
          used,
          expires_at
       FROM gift 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [user_id]
    )

    res.status(200).json({
      success: true,
      history: rows,
    })
  } catch (error) {
    console.error('Get history error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi tải lịch sử',
    })
  }
}
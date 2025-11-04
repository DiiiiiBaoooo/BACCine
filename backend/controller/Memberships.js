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
  const { reward, type } = req.body // từ frontend gửi lên

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

    // 3. Tạo voucher nếu là loại voucher
    let voucherCode = null
    let expiresAt = null

    if (type === 'voucher') {
      voucherCode = 'BAC' + Math.random().toString(36).substring(2, 8).toUpperCase()

      // Tính hạn dùng theo phần thưởng
      let days = 7
      if (reward.includes('20%')) days = 10
      else if (reward.includes('30%')) days = 14
      else if (reward.includes('50K') || reward.includes('100K')) days = 30

      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      // Lưu voucher (tùy chọn: tạo bảng riêng nếu cần)
      // Ở đây lưu luôn vào gift
    }

    // 4. Lưu lịch sử quay thưởng vào bảng gift
    const [giftResult] = await connection.query(
      `INSERT INTO gift 
       (user_id, reward, reward_type, points_spent, voucher_code, expires_at) 
       VALUES (?, ?, ?, 5000, ?, ?)`,
      [user_id, reward, type, voucherCode, expiresAt]
    )

    await connection.commit()

    // 5. Cập nhật điểm mới cho membership card
   

    // 6. Emit realtime cập nhật điểm + lịch sử
    const [newPoints] = await connection.query(
      'SELECT points FROM membership_cards WHERE user_id = ?',
      [user_id]
    )

    global._io.to(`membership_card_${user_id}`).emit('fortune_spin_result', {
      success: true,
      reward,
      voucherCode,
      newPoints: newPoints[0].points,
      giftId: giftResult.insertId,
    })

    // Emit toàn bộ user nếu cần
    global._io.emit('membership_card_points_update', {
      user_id,
      points: newPoints[0].points,
    })

    res.status(200).json({
      success: true,
      message: 'Quay thành công!',
      voucherCode,
      newPoints: newPoints[0].points,
      giftId: giftResult.insertId,
    })
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
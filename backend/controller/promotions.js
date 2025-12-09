import connection from "../config/mysqldb.js";

const getStatistics = async (connection) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM promotions",
    active: "SELECT COUNT(*) as count FROM promotions WHERE status = 'active'",
    upcoming: "SELECT COUNT(*) as count FROM promotions WHERE status = 'upcoming'",
    expired: "SELECT COUNT(*) as count FROM promotions WHERE status = 'expired'",
    inactive: "SELECT COUNT(*) as count FROM promotions WHERE status = 'inactive'",
    out_of_stock: "SELECT COUNT(*) as count FROM promotions WHERE quantity IS NOT NULL AND used_count >= quantity AND status != 'expired'"
  };

  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    const [row] = await connection.query(sql);
    results[key] = row[0].count;
  }

  return results;
};

export const getAllPromotions = async (req,res) =>{
  try {
    const [rows] = await connection.query("SELECT * FROM promotions ");
    res.status(200).json({success:true,promotions:rows})
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const checkDuplicate = async (connection, code, name, excludeId = null) => {
  let query = "SELECT id FROM promotions WHERE code = ? OR name = ?";
  const params = [code, name];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const [rows] = await connection.query(query, params);
  return rows.length > 0 ? rows[0] : null;
};
export const addPromotion = async (req, res) => {
  try {
    const {
      code, name, description, discount_type,
      discount_value, min_order, max_discount,
      start_date, end_date, quantity,
    } = req.body;

    // Kiểm tra thiếu trường
    if (!code || !name || !discount_type || !discount_value || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc!" });
    }

    // Kiểm tra trùng code hoặc tên
    const duplicate = await checkDuplicate(connection, code.trim(), name.trim());
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: duplicate.code === code.trim()
          ? "Mã khuyến mãi đã tồn tại!"
          : "Tên khuyến mãi đã được sử dụng!"
      });
    }

    const now = new Date();
    let status = "active";
    if (new Date(end_date) < now) status = "expired";
    else if (new Date(start_date) > now) status = "upcoming";

    const [result] = await connection.execute(
      `INSERT INTO promotions 
       (code, name, description, discount_type, discount_value, min_order, max_discount, 
        start_date, end_date, quantity, status, used_count) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
      [
        code.trim(),
        name.trim(),
        description || null,
        discount_type,
        discount_value,
        min_order || 0,
        max_discount || null,
        start_date,
        end_date,
        quantity || null,
        status
      ]
    );

    // Cập nhật lại danh sách + thống kê
    const [all] = await connection.query("SELECT * FROM promotions");
    const statistics = await getStatistics(connection);

    global._io.emit("promotions_update", { promotions: all, stats: statistics });

    res.json({
      success: true,
      message: "Thêm khuyến mãi thành công!",
      promotion_id: result.insertId,
      status
    });

  } catch (error) {
    console.error("Lỗi addPromotion:", error.message);
    res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await connection.query("SELECT * FROM promotions WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });
    }
    await connection.query("DELETE FROM promotions WHERE id = ?", [id]);

    const [all] = await connection.query("SELECT * FROM promotions");
    const statistics = await getStatistics(connection);

    global._io.emit("promotions_update", { promotions: all, stats: statistics });

    res.json({ success: true, message: "Xóa khuyến mãi thành công" });
  } catch (error) {
    console.error("Lỗi deletePromotion:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
        code, name, description, discount_type,
        discount_value, min_order, max_discount,
        start_date, end_date, quantity, status
      } = req.body;

      if (!code || !name) {
        return res.status(400).json({ success: false, message: "Mã và tên không được để trống!" });
      }

      // Kiểm tra tồn tại
      const [existing] = await connection.query("SELECT * FROM promotions WHERE id = ?", [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khuyến mãi!" });
      }

  

      let newStatus = status || "active";
      if (!status) {
        const now = new Date();
        if (new Date(end_date) < now) newStatus = "expired";
        else if (new Date(start_date) > now) newStatus = "upcoming";
        else newStatus = "active";
      }

      await connection.execute(
        `UPDATE promotions 
         SET code=?, name=?, description=?, discount_type=?, discount_value=?, 
             min_order=?, max_discount=?, start_date=?, end_date=?, quantity=?, status=? 
         WHERE id=?` ,
        [
          code.trim(),
          name.trim(),
          description || null,
          discount_type,
          discount_value,
          min_order || 0,
          max_discount || null,
          start_date,
          end_date,
          quantity || null,
          newStatus,
          id
        ]
      );

      const [all] = await connection.query("SELECT * FROM promotions");
      const statistics = await getStatistics(connection);

      global._io.emit("promotions_update", { promotions: all, stats: statistics });

      res.json({ success: true, message: "Cập nhật thành công!", status: newStatus });
    }
  
   catch (error) {
    console.error("Lỗi updatePromotion:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPromotionStatistics = async (req, res) => {
  try {
    const statistics = await getStatistics(connection);
    res.json({ success: true, statistics });
  } catch (error) {
    console.error("Lỗi getPromotionStatistics:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getKM = async (req,res) => {
  try {
    const [rows] = await connection.query("SELECT * FROM promotions where status = 'active' ");
    res.status(200).json({success:true,promotions:rows})
  } catch (error) {
    
  }
  
}

export const applyPromotion = async (req,res) => {

  try {
    const { voucherCode } = req.body;
    const {user_id} = req.params;
    const [promotionRows] = await connection.query("SELECT * FROM gift WHERE voucher_code = ? and user_id = ?", [voucherCode,user_id]);
    if (promotionRows.length === 0) {
      return res.status(404).json({success:false,message:"Mã không hợp lệ"})
    }
    const promotion = promotionRows[0];
    if(promotion.used !== 0) {
      return res.status(400).json({success:false,message:"Mã đã được sử dụng"})
    }
    if(promotion.expires_at < new Date()) {
      return res.status(400).json({success:false,message:"Mã đã hết hạn"})
    }
    await connection.query("UPDATE gift SET used = 1 WHERE voucher_code = ? and user_id = ?", [voucherCode,user_id]);
    //khi gọi api, kiểm tra nếu success thì fe sẽ cập nhật lại giá , nếu reward_type= vocher thì kiểm tra discount_type và discount_value ; nếu reward_type= ticket thì  trả về discount_type=fixed và discount_value=100
    if(promotion.reward_type === "voucher") {
     
      if(promotion.discount_type === "percent") {
        res.status(200).json({success:true,message:"Mã áp dụng thành công",discount_type:"percent",discount_value:promotion.discount_value})
      } else if(promotion.discount_type === "fixed") {
        res.status(200).json({success:true,message:"Mã áp dụng thành công",discount_type:"fixed",discount_value:promotion.discount_value})
      }
    } else if(promotion.reward_type === "ticket") {
      res.status(200).json({success:true,message:"Mã áp dụng thành công",discount_type:"percent",discount_value:100})
    }
    


  } catch (error) {
    console.error("Lỗi applyPromotion:", error.message);
    res.status(500).json({success:false,message:error.message})
  }
}
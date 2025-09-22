import connection from "../config/mysqldb.js";

const getStatistics = async (connection) => {
  const [total] = await connection.query("SELECT COUNT(*) as count FROM promotions");
  const [active] = await connection.query("SELECT COUNT(*) as count FROM promotions WHERE status='active'");
  const [upcoming] = await connection.query("SELECT COUNT(*) as count FROM promotions WHERE status='upcoming'");
  const [expired] = await connection.query("SELECT COUNT(*) as count FROM promotions WHERE status='expired'");
  const [inactive] = await connection.query("SELECT COUNT(*) as count FROM promotions WHERE status='inactive'");
  const [outOfStock] = await connection.query("SELECT COUNT(*) as count FROM promotions WHERE used_count >= quantity");

  return {
    total: total[0].count,
    active: active[0].count,
    upcoming: upcoming[0].count,
    expired: expired[0].count,
    inactive: inactive[0].count,
    out_of_stock: outOfStock[0].count,
  };
};

export const getAllPromotions = async (req,res) =>{
  try {
    const [rows] = await connection.query("SELECT * FROM promotions ");
    res.status(200).json({success:true,promotions:rows})
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addPromotion = async (req, res) => {
  try {
    const {
      code, name, description, discount_type,
      discount_value, min_order, max_discount,
      start_date, end_date, quantity,
    } = req.body;

    const now = new Date();
    let status = "active";
    if (new Date(end_date) < now) status = "expired";
    else if (new Date(start_date) > now) status = "upcoming";

    const [result] = await connection.execute(
      `INSERT INTO promotions 
       (code, name, description, discount_type, discount_value, min_order, max_discount, start_date, end_date, quantity, status) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [ code, name, description, discount_type, discount_value,
        min_order || 0, max_discount || null,
        start_date, end_date, quantity, status ]
    );

    // Lấy lại data mới nhất
    const [rows] = await connection.query("SELECT * FROM promotions");
    const statistics = await getStatistics(connection);

    // Emit realtime
    global._io.emit("promotions_update", { promotions: rows, stats: statistics });

    res.json({ success: true, message: "Thêm khuyến mãi thành công", promotion_id: result.insertId, status });
  } catch (error) {
    console.error("Lỗi addPromotion:", error.message);
    res.status(500).json({ success: false, message: error.message });
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
      start_date, end_date, quantity, status,
    } = req.body;

    const [rows] = await connection.query("SELECT * FROM promotions WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });
    }

    let newStatus = status;
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
       WHERE id=?`,
      [ code, name, description, discount_type, discount_value,
        min_order || 0, max_discount || null,
        start_date, end_date, quantity, newStatus, id ]
    );

    const [all] = await connection.query("SELECT * FROM promotions");
    const statistics = await getStatistics(connection);

    global._io.emit("promotions_update", { promotions: all, stats: statistics });

    res.json({ success: true, message: "Cập nhật khuyến mãi thành công", status: newStatus });
  } catch (error) {
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
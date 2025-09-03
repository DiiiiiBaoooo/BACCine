import connectMySqlDB from "../config/mysqldb.js";

export const getAllMembershipTiers = async (req,res) => {
    try {
        const connection = await connectMySqlDB();
        const [rows] = await connection.query("SELECT * FROM membership_tiers");
        res.status(200).json({success:true, membershiptiers:rows})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
}


export const addMembershipTier = async(req,res) =>{
    try {
        const connection = await connectMySqlDB();
        const {minPoints,nameTier,benefits } = req.body;
        if(!minPoints || !nameTier || !benefits){
            res.status(400).json({ success:false,message:"Chua nhap du thong tin the" });

        }
        const [result] = await connection.execute(
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
        const connection = await connectMySqlDB();
        const { id } = req.params;
        const { min_points, benefits } = req.body;
        await connection.execute(
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
      const connection = await connectMySqlDB();
      const { id } = req.params;
      await connection.query("DELETE FROM membership_tiers WHERE id=?", [id]);
      global._io.emit("membershiptiers_update", {
        action: "delete",
        id,
      });
      res.status(200).json({ success: true, message: "Xóa tier thành công" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
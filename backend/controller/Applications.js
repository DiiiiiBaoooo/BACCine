import dbPool from "../config/mysqldb.js";

// 📌 Lấy danh sách ứng viên theo rạp
export const getApplicationByCine = async (req, res) => {
  try {
    const { cinema_id } = req.params;
    if (!cinema_id) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp cinema_id" });
    }

    const [rows] = await dbPool.execute(
      `SELECT a.id, a.job_id, a.applicant_name,a.applied_at ,a.applicant_email, a.applicant_phone, 
              a.resume_link, j.job_title, c.name AS cinema_name, a.status
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN cinema_clusters c ON j.cinema_id = c.id
       WHERE j.cinema_id = ? 
       ORDER BY a.applied_at DESC`,
      [cinema_id]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        applications: [],
        message: "Không tìm thấy ứng viên cho rạp này",
      });
    }

    res.status(200).json({ success: true, applications: rows });
  } catch (error) {
    console.error("❌ Lỗi getApplicationByCine:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Chấp nhận ứng viên (chỉ cập nhật trạng thái)
export const acceptedApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await dbPool.query("SELECT * FROM applications WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: "Không tìm thấy ứng viên" });
    }

    await dbPool.query("UPDATE applications SET status = 'accepted' WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Ứng viên đã được cập nhật trạng thái: accepted",
    });
  } catch (error) {
    console.error("❌ Lỗi acceptedApplication:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 📌 Từ chối ứng viên (chỉ cập nhật trạng thái)
export const rejectedApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await dbPool.query("SELECT * FROM applications WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: "Không tìm thấy ứng viên" });
    }

    await dbPool.query("UPDATE applications SET status = 'rejected' WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Ứng viên đã được cập nhật trạng thái: rejected",
    });
  } catch (error) {
    console.error("❌ Lỗi rejectedApplication:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

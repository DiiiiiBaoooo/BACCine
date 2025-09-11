import dbPool from "../config/mysqldb.js";
export const getApplicationByCine = async (req, res) => {
  try {
    const { cinema_id } = req.params; // Get cinema_id from query params
    if (!cinema_id) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp cinema_id" });
    }


    const [rows] = await dbPool.execute(
      `SELECT a.id, a.job_id, a.applicant_name,a.applied_at ,a.applicant_email, a.applicant_phone, 
              a.resume_link, j.job_title, c.name AS cinema_name
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
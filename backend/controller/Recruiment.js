import connectMySqlDB from "../config/mysqldb.js";

export const getJobbyCinema = async (req, res) => {
  try {
    const { cinema_id } = req.params; // lấy cinema_id từ URL
    const connection = await connectMySqlDB();

    const [rows] = await connection.execute(
      `SELECT j.id, j.job_title, j.department, j.location, j.report_to, 
              j.job_description, j.requirements, j.benefits, j.salary_range, j.deadline,
              c.name, c.address
       FROM jobs j
       JOIN cinema_clusters c ON j.cinema_id = c.id
       WHERE j.cinema_id = ?`,
      [cinema_id]
    );

    // Return success with empty jobs array if no rows found
    if (rows.length === 0) {
      return res.status(200).json({ success: true, jobs: [], message: "Không tìm thấy công việc cho rạp này" });
    }

    res.status(200).json({ success: true, jobs: rows });
  } catch (error) {
    console.error("❌ Lỗi getJobbyCinema:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
import connection from "../config/mysqldb.js";
import cloudinary from "../lib/cloudinary.js";
import streamifier from "streamifier";

export const getJobbyCinema = async (req, res) => {
  try {
    const { cinema_id } = req.params;

    const [rows] = await connection.execute(
      `SELECT j.id, j.job_title, j.department, j.location, j.report_to, 
              j.job_description, j.requirements, j.benefits, j.salary_range, j.deadline,
              c.name, c.address
       FROM jobs j
       JOIN cinema_clusters c ON j.cinema_id = c.id
       WHERE j.cinema_id = ?`,
      [cinema_id]
    );

    if (rows.length === 0) {
      return res.status(200).json({ success: true, jobs: [], message: "Không tìm thấy công việc cho rạp này" });
    }

    res.status(200).json({ success: true, jobs: rows });
  } catch (error) {
    console.error("❌ Lỗi getJobbyCinema:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const applyJob = async (req, res) => {
  try {
    const { applicant_name, applicant_email, applicant_phone } = req.body;
    const { job_id } = req.params;

    // Validate thông tin cơ bản
    if (!applicant_name || !applicant_email || !applicant_phone) {
      return res.status(400).json({ success: false, message: "Chưa nhập đủ thông tin" });
    }

    // Kiểm tra job có tồn tại không
    const [rows] = await connection.query("SELECT * FROM jobs WHERE id = ?", [job_id]);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "Công việc không hợp lệ" });
    }

    // Kiểm tra có file upload không
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng upload CV (PDF)" });
    }

    // Upload file PDF lên Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "resumes",
            format: "pdf", // Explicitly specify PDF format
          },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("✅ Cloudinary upload result:", result); // Debug: Log full result
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(req.file.buffer);
    
    // Check if secure_url is present
    if (!uploadResult.secure_url) {
      console.error("❌ No secure_url in Cloudinary response:", uploadResult);
      return res.status(500).json({ success: false, message: "Lỗi khi upload CV lên Cloudinary" });
    }

    const resume_link = uploadResult.secure_url;

    // Lưu ứng viên vào DB
    await connection.execute(
      `INSERT INTO applications (job_id, applicant_name, applicant_email, applicant_phone, resume_link) 
       VALUES (?, ?, ?, ?, ?)`,
      [job_id, applicant_name, applicant_email, applicant_phone, resume_link]
    );

    res.status(201).json({
      success: true,
      message: "Ứng tuyển thành công!",
      resume_link,
    });
  } catch (error) {
    console.error("❌ Lỗi applyJob:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};



export const getJob = async (req, res) => {
  try {
    const { cinema_id } = req.params;

    const [rows] = await connection.execute(
      `SELECT j.*, c.name AS cinema_name,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       JOIN cinema_clusters c ON j.cinema_id = c.id
       WHERE j.cinema_id = ?
       ORDER BY j.created_at DESC`,
      [cinema_id]
    );

    res.status(200).json({ success: true, jobs: rows });
  } catch (error) {
    console.error("❌ Lỗi getJobbyCinema:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { cinema_id, job_title, department, location, report_to, job_description, requirements, benefits, salary_range, deadline } = req.body;

    if (!cinema_id || !job_title || !department || !location || !job_description || !requirements || !benefits || !salary_range || !deadline) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const [result] = await connection.execute(
      `INSERT INTO jobs (cinema_id, job_title, department, location, report_to, job_description, requirements, benefits, salary_range, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cinema_id, job_title, department, location, report_to || null, job_description, requirements, benefits, salary_range, deadline]
    );

    res.status(201).json({ success: true, message: "Tạo công việc thành công", job_id: result.insertId });
  } catch (error) {
    console.error("❌ Lỗi createJob:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { job_title, department, location, report_to, job_description, requirements, benefits, salary_range, deadline } = req.body;

    if (!job_title || !department || !location || !job_description || !requirements || !benefits || !salary_range || !deadline) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const [result] = await connection.execute(
      `UPDATE jobs
       SET job_title = ?, department = ?, location = ?, report_to = ?, job_description = ?, requirements = ?, benefits = ?, salary_range = ?, deadline = ?
       WHERE id = ?`,
      [job_title, department, location, report_to || null, job_description, requirements, benefits, salary_range, deadline, job_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Công việc không tồn tại" });
    }

    res.status(200).json({ success: true, message: "Cập nhật công việc thành công" });
  } catch (error) {
    console.error("❌ Lỗi updateJob:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { job_id } = req.params;

    // Check if job exists
    const [rows] = await connection.execute(`SELECT * FROM jobs WHERE id = ?`, [job_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Công việc không tồn tại" });
    }

    // Delete associated applications first (due to foreign key constraints)
    await connection.execute(`DELETE FROM applications WHERE job_id = ?`, [job_id]);

    // Delete the job
    await connection.execute(`DELETE FROM jobs WHERE id = ?`, [job_id]);

    res.status(200).json({ success: true, message: "Xóa công việc thành công" });
  } catch (error) {
    console.error("❌ Lỗi deleteJob:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
import dbPool from "../config/mysqldb.js";

// Fetch schedules for a cinema cluster within a date range
export const getWorkScheduleInCine = async (req, res) => {
  const { cinemaClusterId } = req.params;
  const { start, end } = req.query;

  // Validate input
  if (!cinemaClusterId || !start || !end) {
    return res.status(400).json({ error: "cinemaClusterId, start, and end are required" });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  try {
    const [rows] = await dbPool.query(
      `
      SELECT s.id, s.cinema_cluster_id, s.employee_cinema_cluster_id, ecc.employee_id, 
             DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date, 
             s.shift_type, s.status, s.start_time, s.end_time
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE s.cinema_cluster_id = ? AND s.shift_date BETWEEN ? AND ?
      `,
      [cinemaClusterId, start, end]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getWorkScheduleofEmployee = async (req, res) => {
  const { employeeId, cinemaClusterId } = req.params;
  const { start, end } = req.query;

  // Validate input
  if (!employeeId || !cinemaClusterId || !start || !end) {
    return res.status(400).json({ error: "employeeId, cinemaClusterId, start, and end are required" });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  try {
    const [rows] = await dbPool.query(
      `
      SELECT s.id, s.cinema_cluster_id, s.employee_cinema_cluster_id, ecc.employee_id, 
             DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date, 
             s.shift_type, s.status, s.start_time, s.end_time
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE ecc.employee_id = ? AND s.cinema_cluster_id = ? AND s.shift_date BETWEEN ? AND ?
      `,
      [employeeId, cinemaClusterId, start, end]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching employee schedules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Add or update work schedules for a cinema cluster
export const AddWorkScheduleInCine = async (req, res) => {
  const { cinemaClusterId } = req.params;
  const schedules = req.body; // Array of schedule objects

  if (!cinemaClusterId) {
    return res.status(400).json({ error: "cinemaClusterId is required" });
  }

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: "Schedules must be a non-empty array" });
  }

  try {
    // Validate each schedule
    for (const s of schedules) {
      const { employee_id, shift_date, shift_type, status, start_time, end_time, cinema_cluster_id } = s;

      if (
        !employee_id ||
        !shift_date ||
        !shift_type ||
        !status ||
        !cinema_cluster_id ||
        cinema_cluster_id !== (cinemaClusterId)
      ) {
        return res.status(400).json({ error: "Invalid schedule data or mismatched cinema_cluster_id" });
      }

      if (!["morning", "afternoon", "evening"].includes(shift_type)) {
        return res.status(400).json({ error: "Invalid shift_type" });
      }

      if (!["pending", "confirmed", "cancelled","completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(shift_date)) {
        return res.status(400).json({ error: "Invalid shift_date format (YYYY-MM-DD)" });
      }

      if (start_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(start_time)) {
        return res.status(400).json({ error: "Invalid start_time format (HH:MM:SS)" });
      }

      if (end_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(end_time)) {
        return res.status(400).json({ error: "Invalid end_time format (HH:MM:SS)" });
      }
    }

    // Use transaction for consistency
    await dbPool.query("START TRANSACTION");
    try {
      for (const s of schedules) {
        const { employee_id, cinema_cluster_id, shift_date, shift_type, status, start_time, end_time } = s;

        await dbPool.query(
          `
          INSERT INTO schedule (
            cinema_cluster_id, employee_cinema_cluster_id, shift_date, shift_type, status, start_time, end_time
          )
          SELECT ?, ecc.id, ?, ?, ?, ?, ?
          FROM employee_cinema_cluster ecc
          WHERE ecc.employee_id = ? AND ecc.cinema_cluster_id = ?
          ON DUPLICATE KEY UPDATE 
            status = VALUES(status),
            start_time = VALUES(start_time),
            end_time = VALUES(end_time),
            updated_at = CURRENT_TIMESTAMP
          `,
          [
            cinema_cluster_id,
            shift_date,
            shift_type,
            status,
            start_time || null,
            end_time || null,
            employee_id,
            cinema_cluster_id,
          ]
        );
      }

      await dbPool.query("COMMIT");
      res.status(200).json({ status: "success" });
    } catch (error) {
      await dbPool.query("ROLLBACK");
      console.error("Transaction failed:", error);
      res.status(500).json({ error: "Failed to add/update schedules" });
    }
  } catch (error) {
    console.error("Error adding schedules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Update start_time and end_time for a schedule entry (attendance tracking)
export const UpdateWorkScheduleInCine = async (req, res) => {
  const { scheduleId } = req.params;
  const { start_time, end_time } = req.body;

  // Validate input
  if (!scheduleId) {
    return res.status(400).json({ error: "scheduleId is required" });
  }
  if (!start_time || !end_time) {
    return res.status(400).json({ error: "start_time and end_time are required" });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(start_time) || !/^\d{2}:\d{2}(:\d{2})?$/.test(end_time)) {
    return res.status(400).json({ error: "Invalid time format. Use HH:MM:SS" });
  }

  try {
    const [result] = await dbPool.query(
      `
      UPDATE schedule
      SET start_time = ?, end_time = ?
      WHERE id = ?
      `,
      [start_time, end_time, scheduleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const registerFaceDescriptor = async (req, res) => {
  const { employee_id, descriptor, image_url } = req.body;

  if (!employee_id || !descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: "Invalid input: descriptor must be 128-dim array" });
  }

  try {
    const [result] = await dbPool.query(
      `INSERT INTO employee_face_descriptors (employee_id, descriptor, image_url) VALUES (?, ?, ?)`,
      [employee_id, JSON.stringify(descriptor), image_url || null]
    );

    res.status(201).json({ id: result.insertId, message: "Face descriptor registered successfully" });
  } catch (error) {
    console.error("Error registering face:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Hàm helper so sánh Euclidean distance (từ face-api.js logic)
const computeEuclideanDistance = (desc1, desc2) => {
  return Math.sqrt(desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0));
};

export const faceCheckin = async (req, res) => {
  const { descriptor, cinema_cluster_id, schedule_id } = req.body; // Thêm schedule_id

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: "Invalid descriptor" });
  }

  const THRESHOLD = 0.6;

  try {
    // Lấy tất cả active descriptors
    const [descriptors] = await dbPool.query(
      `
      SELECT efd.id, efd.employee_id, efd.descriptor
      FROM employee_face_descriptors efd
      JOIN employee_cinema_cluster ecc ON efd.employee_id = ecc.employee_id
      WHERE ecc.cinema_cluster_id = ? AND efd.is_active = 1
      `,
      [cinema_cluster_id]
    );

    let matchedEmployee = null;
    let minDistance = Infinity;

    for (const descRow of descriptors) {
      const storedDesc = JSON.parse(descRow.descriptor);
      const distance = computeEuclideanDistance(descriptor, storedDesc);
      
      if (distance < minDistance) {
        minDistance = distance;
        matchedEmployee = descRow.employee_id;
      }
    }

    if (minDistance > THRESHOLD) {
      return res.status(404).json({ error: "No matching employee found" });
    }

    // Kiểm tra xem schedule_id có thuộc về employee này không
    const [scheduleCheck] = await dbPool.query(
      `
      SELECT s.id, s.status, ecc.employee_id
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE s.id = ? AND s.cinema_cluster_id = ?
      `,
      [schedule_id, cinema_cluster_id]
    );

    if (scheduleCheck.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (scheduleCheck[0].employee_id !== matchedEmployee) {
      return res.status(403).json({ error: "Schedule does not belong to matched employee" });
    }

    // Cập nhật attendance cho schedule cụ thể
    const now = new Date().toTimeString().slice(0, 8);
    await dbPool.query(
      `UPDATE schedule SET start_time = ?, status = 'confirmed' WHERE id = ?`,
      [now, schedule_id]
    );

    res.status(200).json({ 
      employee_id: matchedEmployee, 
      distance: minDistance, 
      message: "Check-in successful" 
    });
  } catch (error) {
    console.error("Error in face checkin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const faceCheckout = async (req, res) => {
  const { descriptor, cinema_cluster_id, schedule_id } = req.body; // Thêm schedule_id

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: "Invalid descriptor" });
  }

  const THRESHOLD = 0.6;

  try {
    // Lấy tất cả active descriptors
    const [descriptors] = await dbPool.query(
      `
      SELECT efd.id, efd.employee_id, efd.descriptor
      FROM employee_face_descriptors efd
      JOIN employee_cinema_cluster ecc ON efd.employee_id = ecc.employee_id
      WHERE ecc.cinema_cluster_id = ? AND efd.is_active = 1
      `,
      [cinema_cluster_id]
    );

    let matchedEmployee = null;
    let minDistance = Infinity;

    for (const descRow of descriptors) {
      const storedDesc = JSON.parse(descRow.descriptor);
      const distance = computeEuclideanDistance(descriptor, storedDesc);
      
      if (distance < minDistance) {
        minDistance = distance;
        matchedEmployee = descRow.employee_id;
      }
    }

    if (minDistance > THRESHOLD) {
      return res.status(404).json({ error: "No matching employee found" });
    }

    // Kiểm tra xem schedule_id có thuộc về employee này không
    const [scheduleCheck] = await dbPool.query(
      `
      SELECT s.id, s.status, ecc.employee_id
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE s.id = ? AND s.cinema_cluster_id = ?
      `,
      [schedule_id, cinema_cluster_id]
    );

    if (scheduleCheck.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (scheduleCheck[0].employee_id !== matchedEmployee) {
      return res.status(403).json({ error: "Schedule does not belong to matched employee" });
    }

    // Cập nhật attendance cho schedule cụ thể
    const now = new Date().toTimeString().slice(0, 8);
    await dbPool.query(
      `UPDATE schedule SET end_time = ?, status ='completed' WHERE id = ?`,
      [now, schedule_id]
    );

    res.status(200).json({ 
      employee_id: matchedEmployee, 
      distance: minDistance, 
      message: "Check-in successful" 
    });
  } catch (error) {
    console.error("Error in face checkin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Kiểm tra xem nhân viên đã đăng ký face descriptor chưa
export const checkFaceDescriptor = async (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  try {
    const [rows] = await dbPool.query(
      `SELECT id FROM employee_face_descriptors WHERE employee_id = ? AND is_active = 1`,
      [employeeId]
    );

    res.status(200).json({ hasFaceDescriptor: rows.length > 0 });
  } catch (error) {
    console.error('Error checking face descriptor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
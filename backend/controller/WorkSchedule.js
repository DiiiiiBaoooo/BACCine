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

      if (!["pending", "confirmed", "cancelled"].includes(status)) {
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
import dbPool from "../config/mysqldb.js";
const markAbsentForPastShifts = async (connection) => {
  try {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentDate = vnTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = vnTime.toTimeString().split(' ')[0]; // HH:MM:SS
console.log(vnTime);

    // Cập nhật status = 'absent' cho các ca đã qua mà chưa checkout
    // (hoặc chưa checkin nếu bạn muốn strict hơn)
    const query = `
      UPDATE schedule
      SET status = 'absent', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('pending', 'confirmed',"")
        AND (
          -- Ca đã qua hôm trước
          shift_date < ?
          OR
          -- Ca hôm nay nhưng đã qua giờ kết thúc
          (shift_date = ? AND end_time IS NOT NULL AND end_time < ?)
        )
    `;

    const [result] = await connection.query(query, [
      currentDate,
      currentDate,
      currentTime
    ]);

    console.log(`✅ Đã đánh dấu ${result.affectedRows} ca vắng mặt`);
    return result.affectedRows;
  } catch (error) {
    console.error('❌ Lỗi markAbsentForPastShifts:', error);
    throw error;
  }
};

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
            await markAbsentForPastShifts(dbPool);

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
        await markAbsentForPastShifts(dbPool);

  const [rows] = await dbPool.query(
      `
      SELECT 
        s.id, 
        s.cinema_cluster_id, 
        s.employee_cinema_cluster_id, 
        ecc.employee_id, 
        DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date, 
        s.shift_type, 
        s.status, 
        s.start_time, 
        s.end_time,
        -- ⭐ THÊM FLAG ĐỂ FRONTEND BIẾT CA ĐÃ QUA
        CASE 
          WHEN s.shift_date < CURDATE() THEN true
          WHEN s.shift_date = CURDATE() AND s.end_time < CURTIME() THEN true
          ELSE false
        END as is_past
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE ecc.employee_id = ? 
        AND s.cinema_cluster_id = ? 
        AND s.shift_date BETWEEN ? AND ?
      ORDER BY s.shift_date ASC, s.start_time ASC
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
          await dbPool.query("SET time_zone = '+07:00'");

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
// ========== HÀM HELPER LẤY GIỜ VIỆT NAM ==========
const getVietnamTime = () => {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  const hour = vietnamTime.getUTCHours();
  const minute = vietnamTime.getUTCMinutes();
  const second = vietnamTime.getUTCSeconds();
  
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

// ========== FACE CHECKIN - ĐÃ SỬA ==========
export const faceCheckin = async (req, res) => {
  const { descriptor, cinema_cluster_id, schedule_id } = req.body;

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: "Invalid descriptor" });
  }

  const THRESHOLD = 0.6;

  try {
    // 1. KIỂM TRA LỊCH TRÌNH
    const [scheduleCheck] = await dbPool.query(
      `
      SELECT 
        s.id, 
        s.status, 
        s.shift_date,
        ecc.employee_id
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE s.id = ? AND s.cinema_cluster_id = ?
      `,
      [schedule_id, cinema_cluster_id]
    );

    if (scheduleCheck.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const getVietnamDate = (utcDateString) => {
      const date = new Date(utcDateString);
      const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return vietnamDate.toISOString().split('T')[0];
    };

    const schedule = scheduleCheck[0];
    const shiftDate = getVietnamDate(schedule.shift_date);
    const today = getVietnamDate(new Date().toISOString());

    // 2. KIỂM TRA NGÀY
    if (shiftDate !== today) {
      if (shiftDate < today) {
        return res.status(400).json({ 
          error: "Không thể chấm công cho ca đã qua" 
        });
      } else {
        return res.status(400).json({ 
          error: "Chỉ có thể chấm công vào ngày làm việc" 
        });
      }
    }

    // 3. KIỂM TRA TRẠNG THÁI
    if (schedule.status === 'completed') {
      return res.status(400).json({ 
        error: "Ca làm việc đã hoàn thành" 
      });
    }

    if (schedule.status === 'absent') {
      return res.status(400).json({ 
        error: "Ca làm việc đã bị đánh dấu vắng mặt" 
      });
    }

    // 4. Lấy descriptors
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

    // 5. Kiểm tra nhân viên
    if (schedule.employee_id !== matchedEmployee) {
      return res.status(403).json({ 
        error: "Schedule does not belong to matched employee" 
      });
    }

    // 6. ⭐ CẬP NHẬT CHECKIN - SỬ DỤNG GIỜ VIỆT NAM
    const vietnamTime = getVietnamTime();
    
    await dbPool.query(
      `UPDATE schedule 
       SET start_time = ?, status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [vietnamTime, schedule_id]
    );

    res.status(200).json({ 
      employee_id: matchedEmployee, 
      distance: minDistance,
      checkin_time: vietnamTime,
      message: "Check-in successful" 
    });
  } catch (error) {
    console.error("Error in face checkin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========== FACE CHECKOUT - ĐÃ SỬA ==========
export const faceCheckout = async (req, res) => {
  const { descriptor, cinema_cluster_id, schedule_id } = req.body;

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: "Invalid descriptor" });
  }

  const THRESHOLD = 0.6;

  try {
    // 1. KIỂM TRA LỊCH TRÌNH
    const [scheduleCheck] = await dbPool.query(
      `
      SELECT 
        s.id, 
        s.status, 
        s.shift_date,
        s.start_time,
        ecc.employee_id
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE s.id = ? AND s.cinema_cluster_id = ?
      `,
      [schedule_id, cinema_cluster_id]
    );

    if (scheduleCheck.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const getVietnamDate = (utcDateString) => {
      const date = new Date(utcDateString);
      const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return vietnamDate.toISOString().split('T')[0];
    };

    const schedule = scheduleCheck[0];
    const shiftDate = getVietnamDate(schedule.shift_date);
    const today = getVietnamDate(new Date().toISOString());

    // 2. KIỂM TRA NGÀY
    if (shiftDate !== today) {
      return res.status(400).json({ 
        error: "Chỉ có thể checkout vào ngày làm việc" 
      });
    }

    // 3. KIỂM TRA ĐÃ CHECKIN
    if (schedule.status !== 'confirmed') {
      return res.status(400).json({ 
        error: "Chưa check-in ca làm việc này" 
      });
    }

    if (!schedule.start_time) {
      return res.status(400).json({ 
        error: "Không tìm thấy thời gian check-in" 
      });
    }

    // 4. Lấy descriptors
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

    if (schedule.employee_id !== matchedEmployee) {
      return res.status(403).json({ 
        error: "Schedule does not belong to matched employee" 
      });
    }

    // 7. ⭐ CẬP NHẬT CHECKOUT - SỬ DỤNG GIỜ VIỆT NAM
    const vietnamTime = getVietnamTime();
    
    await dbPool.query(
      `UPDATE schedule 
       SET end_time = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [vietnamTime, schedule_id]
    );

    res.status(200).json({ 
      employee_id: matchedEmployee, 
      distance: minDistance,
      checkout_time: vietnamTime,
      message: "Check-out successful" 
    });
  } catch (error) {
    console.error("Error in face checkout:", error);
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
export const getAttendanceHistory = async (req, res) => {
  const { cinemaClusterId } = req.params;
  const { 
    start_date, 
    end_date, 
    employee_id, 
    status, 
    shift_type,
    search_name,
    page = 1,
    limit = 50
  } = req.query;

  if (!cinemaClusterId) {
    return res.status(400).json({ error: "cinemaClusterId is required" });
  }

  try {
    let conditions = ['s.cinema_cluster_id = ?'];
    let params = [cinemaClusterId];

    // Bộ lọc ngày
    if (start_date) {
      conditions.push('s.shift_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('s.shift_date <= ?');
      params.push(end_date);
    }

    // Bộ lọc nhân viên
    if (employee_id) {
      conditions.push('ecc.employee_id = ?');
      params.push(employee_id);
    }

    // Bộ lọc trạng thái
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    // Bộ lọc ca làm việc
    if (shift_type) {
      conditions.push('s.shift_type = ?');
      params.push(shift_type);
    }

    // Tìm kiếm theo tên
    if (search_name) {
      conditions.push('name LIKE ?');
      params.push(`%${search_name}%`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Đếm tổng số bản ghi
    const [countResult] = await dbPool.query(
      `
      SELECT COUNT(*) as total
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      join users e on ecc.employee_id = e.id
      WHERE ${whereClause}
      `,
      params
    );

    const total = countResult[0].total;

    // Lấy dữ liệu phân trang
   // Thay đoạn SELECT cũ bằng cái này:
const [rows] = await dbPool.query(
  `
  SELECT 
    s.id,
    s.cinema_cluster_id,
    ecc.employee_id,
    e.name as employee_name,
    e.email as employee_email,
    DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date,
    s.shift_type,
    s.status,
    s.start_time,
    s.end_time,
    s.created_at,
    s.updated_at,
    -- Tính đúng phút làm việc, không bị âm
    IFNULL(
      CASE 
        WHEN s.start_time IS NOT NULL AND s.end_time IS NOT NULL THEN
          IF(
            TIME(s.end_time) < TIME(s.start_time),
            TIMESTAMPDIFF(MINUTE, s.start_time, ADDTIME(s.end_time, '24:00:00')),
            TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)
          )
        ELSE NULL
      END,
      NULL
    ) as work_duration_minutes
  FROM schedule s
  JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
  JOIN users e ON ecc.employee_id = e.id
  WHERE ${whereClause}
  ORDER BY s.shift_date DESC, s.start_time DESC
  LIMIT ? OFFSET ?
  `,
  [...params, parseInt(limit), parseInt(offset)]
);

    res.status(200).json({
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API thống kê chấm công
export const getAttendanceStats = async (req, res) => {
  const { cinemaClusterId } = req.params;
  const { start_date, end_date, employee_id } = req.query;

  if (!cinemaClusterId) {
    return res.status(400).json({ error: "cinemaClusterId is required" });
  }

  try {
    let conditions = ['s.cinema_cluster_id = ?'];
    let params = [cinemaClusterId];

    if (start_date) {
      conditions.push('s.shift_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('s.shift_date <= ?');
      params.push(end_date);
    }
    if (employee_id) {
      conditions.push('ecc.employee_id = ?');
      params.push(employee_id);
    }

    const whereClause = conditions.join(' AND ');

    const [stats] = await dbPool.query(
      `
      SELECT 
        COUNT(*) as total_shifts,
        SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_shifts,
        SUM(CASE WHEN s.status = 'absent' THEN 1 ELSE 0 END) as absent_shifts,
        SUM(CASE WHEN s.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_shifts,
        SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) as pending_shifts,
        -- Tổng giờ làm việc
      SUM(
  CASE 
    WHEN s.start_time IS NOT NULL AND s.end_time IS NOT NULL THEN
      IF(
        TIME(s.end_time) < TIME(s.start_time),
        TIMESTAMPDIFF(MINUTE, s.start_time, ADDTIME(s.end_time, '24:00:00')),
        TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)
      )
    ELSE 0
  END
) / 60.0 as total_work_hours,
        -- Thống kê theo ca
        SUM(CASE WHEN s.shift_type = 'morning' THEN 1 ELSE 0 END) as morning_shifts,
        SUM(CASE WHEN s.shift_type = 'afternoon' THEN 1 ELSE 0 END) as afternoon_shifts,
        SUM(CASE WHEN s.shift_type = 'evening' THEN 1 ELSE 0 END) as evening_shifts
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE ${whereClause}
      `,
      params
    );

    res.status(200).json(stats[0]);
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API lấy chi tiết một bản ghi chấm công
export const getAttendanceDetail = async (req, res) => {
  const { scheduleId } = req.params;

  if (!scheduleId) {
    return res.status(400).json({ error: "scheduleId is required" });
  }

  try {
    const [rows] = await dbPool.query(
      `
      SELECT 
        s.id,
        s.cinema_cluster_id,
        cc.name as cinema_cluster_name,
        ecc.employee_id,
        name as employee_name,
        DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date,
        s.shift_type,
        s.status,
        s.start_time,
        s.end_time,
        s.created_at,
        s.updated_at,
        CASE 
          WHEN s.start_time IS NOT NULL AND s.end_time IS NOT NULL THEN
            TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)
          ELSE NULL
        END as work_duration_minutes
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      JOIN cinema_cluster cc ON s.cinema_cluster_id = cc.id
      join users e on ecc.employee_id = e.id
      WHERE s.id = ?
      `,
      [scheduleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching attendance detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API xuất báo cáo chấm công (CSV)
export const exportAttendanceReport = async (req, res) => {
  const { cinemaClusterId } = req.params;
  const { start_date, end_date, employee_id } = req.query;

  if (!cinemaClusterId) {
    return res.status(400).json({ error: "cinemaClusterId is required" });
  }

  try {
    let conditions = ['s.cinema_cluster_id = ?'];
    let params = [cinemaClusterId];

    if (start_date) {
      conditions.push('s.shift_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('s.shift_date <= ?');
      params.push(end_date);
    }
    if (employee_id) {
      conditions.push('ecc.employee_id = ?');
      params.push(employee_id);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await dbPool.query(
      `
      SELECT 
        e.name as 'Tên nhân viên',
        DATE_FORMAT(s.shift_date, '%d/%m/%Y') as 'Ngày',
        CASE 
          WHEN s.shift_type = 'morning' THEN 'Sáng'
          WHEN s.shift_type = 'afternoon' THEN 'Chiều'
          WHEN s.shift_type = 'evening' THEN 'Tối'
        END as 'Ca làm việc',
        CASE 
          WHEN s.status = 'completed' THEN 'Hoàn thành'
          WHEN s.status = 'absent' THEN 'Vắng mặt'
          WHEN s.status = 'confirmed' THEN 'Đã xác nhận'
          WHEN s.status = 'pending' THEN 'Chờ xác nhận'
        END as 'Trạng thái',
        IFNULL(s.start_time, '') as 'Giờ vào',
        IFNULL(s.end_time, '') as 'Giờ ra',
        IFNULL(
          CONCAT(
            FLOOR(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60), 'h ',
            TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) % 60, 'p'
          ),
          ''
        ) as 'Tổng giờ'
      FROM schedule s
      JOIN employee_cinema_cluster 
      WHERE ${whereClause}
      ORDER BY s.shift_date DESC
      `,
      params
    );

    // Tạo CSV
    const headers = Object.keys(rows[0] || {});
    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const bom = '\uFEFF'; // BOM for UTF-8

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Kiểm tra nhân viên có đang trong ca làm việc không
// Kiểm tra nhân viên có đang trong ca làm việc không
export const checkCurrentShift = async (req, res) => {
  const { employeeId, cinemaClusterId } = req.params;

  if (!employeeId || !cinemaClusterId) {
    return res.status(400).json({ error: "employeeId và cinemaClusterId là bắt buộc" });
  }

  try {
    // ⭐ LẤY THỜI GIAN HIỆN TẠI THEO MÚI GIỜ VIỆT NAM (UTC+7)
    const now = new Date();
    
    // Chuyển đổi sang giờ Việt Nam
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Lấy các thông tin thời gian từ vietnamTime
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const hour = vietnamTime.getUTCHours();
    const minute = vietnamTime.getUTCMinutes();
    const second = vietnamTime.getUTCSeconds();
    
    const currentDate = `${year}-${month}-${day}`; // YYYY-MM-DD
    const currentTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`; // HH:MM:SS

    console.log('🕐 Vietnam Time:', {
      currentDate,
      currentTime,
      hour,
      minute
    });

    // ⭐ KIỂM TRA GIỜ ĐÓNG CỬA RẠP (0h-6h)
    if (hour >= 0 && hour < 6) {
      return res.status(200).json({
        hasShift: false,
        isClosed: true,
        message: "Rạp phim ngoài giờ phục vụ",
        currentTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        closedPeriod: "00:00 - 06:00",
        reopenTime: "06:00"
      });
    }

    // Xác định ca làm việc hiện tại dựa trên giờ
    let currentShift = null;
    
    if (hour >= 6 && hour < 12) {
      currentShift = 'morning';
    } else if (hour >= 12 && hour < 18) {
      currentShift = 'afternoon';
    } else if (hour >= 18 && hour < 24) {
      currentShift = 'evening';
    }

    // Kiểm tra xem nhân viên có lịch làm việc trong ca hiện tại không
    const [schedules] = await dbPool.query(
      `
      SELECT 
        s.id,
        s.shift_type,
        s.status,
        s.shift_date,
        s.start_time,
        s.end_time
      FROM schedule s
      JOIN employee_cinema_cluster ecc ON s.employee_cinema_cluster_id = ecc.id
      WHERE ecc.employee_id = ?
        AND ecc.cinema_cluster_id = ?
        AND s.shift_date = ?
        AND s.shift_type = ?
        AND s.status IN ('pending', 'confirmed')
      LIMIT 1
      `,
      [employeeId, cinemaClusterId, currentDate, currentShift]
    );

    if (schedules.length === 0) {
      return res.status(200).json({
        hasShift: false,
        isClosed: false,
        message: "Chưa tới ca làm việc",
        currentShift,
        currentTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      });
    }

    // Có ca làm việc
    return res.status(200).json({
      hasShift: true,
      isClosed: false,
      message: "Đang trong ca làm việc",
      schedule: schedules[0],
      currentShift,
      currentTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    });

  } catch (error) {
    console.error("Error checking current shift:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
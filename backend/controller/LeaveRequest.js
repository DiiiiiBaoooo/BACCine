import dbPool from "../config/mysqldb.js";

// ============= HELPER FUNCTIONS =============

// Tính số ngày làm việc giữa 2 ngày (trừ cuối tuần)
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Không phải CN (0) và T7 (6)
      count++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  return count;
};

// Lấy giờ Việt Nam
const getVietnamTime = () => {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return {
    date: vietnamTime.toISOString().split('T')[0],
    datetime: vietnamTime.toISOString().slice(0, 19).replace('T', ' ')
  };
};

// ============= API ENDPOINTS =============

// 1. Tạo đơn xin nghỉ phép
export const createLeaveRequest = async (req, res) => {
  const { 
    employee_id, 
    cinema_cluster_id, 
    leave_type, 
    start_date, 
    end_date, 
    reason 
  } = req.body;
  console.log(employee_id);
  console.log(cinema_cluster_id);
  

  // Validate input
  if (!employee_id || !cinema_cluster_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ 
      error: "Thiếu thông tin bắt buộc" 
    });
  }
  

  // Validate leave_type
  const validLeaveTypes = ['annual', 'sick', 'personal', 'unpaid'];
  if (!validLeaveTypes.includes(leave_type)) {
    return res.status(400).json({ 
      error: "Loại nghỉ phép không hợp lệ" 
    });
  }

  // Validate dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    return res.status(400).json({ 
      error: "Định dạng ngày không hợp lệ (YYYY-MM-DD)" 
    });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ 
      error: "Ngày bắt đầu phải trước ngày kết thúc" 
    });
  }

  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Kiểm tra employee_cinema_cluster_id
    const [employeeCheck] = await connection.query(
      `SELECT id FROM employee_cinema_cluster 
       WHERE employee_id = ? AND cinema_cluster_id = ?`,
      [employee_id, cinema_cluster_id]
    );

    if (employeeCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: "Nhân viên không thuộc cụm rạp này" 
      });
    }

    const employee_cinema_cluster_id = employeeCheck[0].id;

    // 2. Kiểm tra số ngày phép còn lại (chỉ với annual leave)
    const total_days = calculateWorkingDays(start_date, end_date);
    
    if (leave_type === 'annual') {
      const [balanceCheck] = await connection.query(
        `SELECT annual_leave_remaining 
         FROM leave_balance 
         WHERE employee_cinema_cluster_id = ? AND year = YEAR(CURDATE())`,
        [employee_cinema_cluster_id]
      );

      if (balanceCheck.length === 0) {
        // Tạo mới leave_balance nếu chưa có
        await connection.query(
          `INSERT INTO leave_balance (employee_cinema_cluster_id, year) 
           VALUES (?, YEAR(CURDATE()))`,
          [employee_cinema_cluster_id]
        );
      } else {
        const remaining = balanceCheck[0].annual_leave_remaining;
        if (remaining < total_days) {
          await connection.rollback();
          return res.status(400).json({ 
            error: `Không đủ ngày phép. Còn lại: ${remaining} ngày, yêu cầu: ${total_days} ngày` 
          });
        }
      }
    }

    // 3. Kiểm tra trùng lặp đơn nghỉ phép
    const [existingRequests] = await connection.query(
      `SELECT id FROM leave_request 
       WHERE employee_cinema_cluster_id = ? 
         AND status NOT IN ('rejected', 'cancelled')
         AND (
           (start_date BETWEEN ? AND ?) OR
           (end_date BETWEEN ? AND ?) OR
           (start_date <= ? AND end_date >= ?)
         )`,
      [employee_cinema_cluster_id, start_date, end_date, start_date, end_date, start_date, end_date]
    );

    if (existingRequests.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: "Đã có đơn nghỉ phép trong khoảng thời gian này" 
      });
    }

    // 4. Tạo đơn xin nghỉ
    const [result] = await connection.query(
      `INSERT INTO leave_request (
        employee_cinema_cluster_id,
        cinema_cluster_id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [employee_cinema_cluster_id, cinema_cluster_id, leave_type, start_date, end_date, total_days, reason]
    );

    const leave_request_id = result.insertId;

    // 5. Tìm các ca làm việc bị ảnh hưởng
    const [affectedSchedules] = await connection.query(
      `SELECT id FROM schedule 
       WHERE employee_cinema_cluster_id = ? 
         AND shift_date BETWEEN ? AND ?
         AND status IN ('pending', 'confirmed')`,
      [employee_cinema_cluster_id, start_date, end_date]
    );

    // 6. Lưu các ca bị ảnh hưởng
    if (affectedSchedules.length > 0) {
      const values = affectedSchedules.map(s => 
        `(${leave_request_id}, ${s.id}, 'needed')`
      ).join(',');
      
      await connection.query(
        `INSERT INTO leave_affected_schedule (leave_request_id, schedule_id, replacement_status) 
         VALUES ${values}`
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Tạo đơn xin nghỉ phép thành công",
      leave_request_id,
      total_days,
      affected_shifts: affectedSchedules.length
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error creating leave request:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    connection.release();
  }
};

// 2. Lấy danh sách đơn xin nghỉ phép (cho manager)
export const getLeaveRequests = async (req, res) => {
  const { cinema_cluster_id } = req.params;
  const { 
    status, 
    employee_id, 
    start_date, 
    end_date,
    page = 1,
    limit = 20 
  } = req.query;

  if (!cinema_cluster_id) {
    return res.status(400).json({ error: "cinema_cluster_id là bắt buộc" });
  }

  try {
    let conditions = ['lr.cinema_cluster_id = ?'];
    let params = [cinema_cluster_id];

    if (status) {
      conditions.push('lr.status = ?');
      params.push(status);
    }

    if (employee_id) {
      conditions.push('u.id = ?');
      params.push(employee_id);
    }

    if (start_date) {
      conditions.push('lr.start_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('lr.end_date <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Đếm tổng số
    const [countResult] = await dbPool.query(
      `SELECT COUNT(*) as total
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       JOIN users u ON ecc.employee_id = u.id
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Lấy dữ liệu
    const [rows] = await dbPool.query(
      `SELECT 
        lr.id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.rejection_reason,
        lr.created_at,
        lr.approved_at,
        u.id as employee_id,
        u.name as employee_name,
        u.email as employee_email,
        approver.name as approver_name,
        (SELECT COUNT(*) FROM leave_affected_schedule 
         WHERE leave_request_id = lr.id) as affected_shifts_count
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       JOIN users u ON ecc.employee_id = u.id
       LEFT JOIN employee_cinema_cluster approver_ecc ON lr.approver_id = approver_ecc.id
       LEFT JOIN users approver ON approver_ecc.employee_id = approver.id
       WHERE ${whereClause}
       ORDER BY lr.created_at DESC
       LIMIT ? OFFSET ?`,
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
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 3. Lấy đơn nghỉ phép của nhân viên
export const getEmployeeLeaveRequests = async (req, res) => {
  const { employee_id, cinema_cluster_id } = req.params;
  const { status } = req.query;

  if (!employee_id || !cinema_cluster_id) {
    return res.status(400).json({ 
      error: "employee_id và cinema_cluster_id là bắt buộc" 
    });
  }

  try {
    let conditions = ['ecc.employee_id = ? AND lr.cinema_cluster_id = ?'];
    let params = [employee_id, cinema_cluster_id];

    if (status) {
      conditions.push('lr.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await dbPool.query(
      `SELECT 
        lr.id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.rejection_reason,
        lr.created_at,
        lr.approved_at,
        approver.name as approver_name,
        (SELECT COUNT(*) FROM leave_affected_schedule 
         WHERE leave_request_id = lr.id) as affected_shifts_count
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       LEFT JOIN employee_cinema_cluster approver_ecc ON lr.approver_id = approver_ecc.id
       LEFT JOIN users approver ON approver_ecc.employee_id = approver.id
       WHERE ${whereClause}
       ORDER BY lr.created_at DESC`,
      params
    );

    // Lấy số dư ngày phép
    const [balance] = await dbPool.query(
      `SELECT 
        annual_leave_total,
        annual_leave_used,
        annual_leave_remaining,
        sick_leave_used
       FROM leave_balance lb
       JOIN employee_cinema_cluster ecc ON lb.employee_cinema_cluster_id = ecc.id
       WHERE ecc.employee_id = ? 
         AND ecc.cinema_cluster_id = ?
         AND lb.year = YEAR(CURDATE())`,
      [employee_id, cinema_cluster_id]
    );

    res.status(200).json({
      leave_requests: rows,
      leave_balance: balance[0] || {
        annual_leave_total: 12,
        annual_leave_used: 0,
        annual_leave_remaining: 12,
        sick_leave_used: 0
      }
    });

  } catch (error) {
    console.error("Error fetching employee leave requests:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 4. Chi tiết đơn nghỉ phép
export const getLeaveRequestDetail = async (req, res) => {
  const { leave_request_id } = req.params;

  if (!leave_request_id) {
    return res.status(400).json({ error: "leave_request_id là bắt buộc" });
  }

  try {
    const [rows] = await dbPool.query(
      `SELECT 
        lr.id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.rejection_reason,
        lr.created_at,
        lr.approved_at,
        u.id as employee_id,
        u.name as employee_name,
        u.email as employee_email,
        approver.name as approver_name,
        cc.name as cinema_cluster_name
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       JOIN users u ON ecc.employee_id = u.id
       JOIN cinema_clusters cc ON lr.cinema_cluster_id = cc.id
       LEFT JOIN employee_cinema_cluster approver_ecc ON lr.approver_id = approver_ecc.id
       LEFT JOIN users approver ON approver_ecc.employee_id = approver.id
       WHERE lr.id = ?`,
      [leave_request_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn nghỉ phép" });
    }

    // Lấy các ca bị ảnh hưởng
    const [affectedShifts] = await dbPool.query(
      `SELECT 
        las.id,
        s.shift_date,
        s.shift_type,
        s.status as schedule_status,
        las.replacement_status,
        replacement.name as replacement_name
       FROM leave_affected_schedule las
       JOIN schedule s ON las.schedule_id = s.id
       LEFT JOIN employee_cinema_cluster replacement_ecc ON las.replacement_employee_id = replacement_ecc.id
       LEFT JOIN users replacement ON replacement_ecc.employee_id = replacement.id
       WHERE las.leave_request_id = ?
       ORDER BY s.shift_date, s.shift_type`,
      [leave_request_id]
    );

    res.status(200).json({
      ...rows[0],
      affected_shifts: affectedShifts
    });

  } catch (error) {
    console.error("Error fetching leave request detail:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 5. Duyệt đơn nghỉ phép
export const approveLeaveRequest = async (req, res) => {
  const { leave_request_id } = req.params;
  const { approver_employee_id, approver_cinema_cluster_id } = req.body;

  if (!leave_request_id || !approver_employee_id || !approver_cinema_cluster_id) {
    return res.status(400).json({ 
      error: "Thiếu thông tin người duyệt" 
    });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Kiểm tra đơn nghỉ phép
    const [leaveCheck] = await connection.query(
      `SELECT lr.*, ecc.employee_id
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       WHERE lr.id = ?`,
      [leave_request_id]
    );

    if (leaveCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Không tìm thấy đơn nghỉ phép" });
    }

    const leaveRequest = leaveCheck[0];

    if (leaveRequest.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Đơn đã được ${leaveRequest.status === 'approved' ? 'duyệt' : 'từ chối'}` 
      });
    }

    // 2. Lấy approver_id
    const [approverCheck] = await connection.query(
      `SELECT manager_id FROM cinema_clusters 
       WHERE manager_id = ? AND id = ?`,
      [approver_employee_id, approver_cinema_cluster_id]
    );

    if (approverCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Người duyệt không hợp lệ" });
    }

    const approver_id = approverCheck[0].id;

    // 3. Cập nhật trạng thái đơn
    await connection.query(
      `UPDATE leave_request 
       SET status = 'approved', 
           approver_id = ?, 
           approved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [approver_id, leave_request_id]
    );

    // 4. Cập nhật số ngày phép (nếu là annual leave)
    if (leaveRequest.leave_type === 'annual') {
      await connection.query(
        `UPDATE leave_balance 
         SET annual_leave_used = annual_leave_used + ?,
             annual_leave_remaining = annual_leave_remaining - ?
         WHERE employee_cinema_cluster_id = ? AND year = YEAR(CURDATE())`,
        [leaveRequest.total_days, leaveRequest.total_days, leaveRequest.employee_cinema_cluster_id]
      );
    }

    // 5. Hủy các ca làm việc bị ảnh hưởng
    await connection.query(
      `UPDATE schedule s
       JOIN leave_affected_schedule las ON s.id = las.schedule_id
       SET s.status = 'cancelled'
       WHERE las.leave_request_id = ?`,
      [leave_request_id]
    );

    await connection.commit();

    res.status(200).json({ 
      message: "Duyệt đơn nghỉ phép thành công" 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error approving leave request:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    connection.release();
  }
};

// 6. Từ chối đơn nghỉ phép
export const rejectLeaveRequest = async (req, res) => {
  const { leave_request_id } = req.params;
  const { approver_employee_id, approver_cinema_cluster_id, rejection_reason } = req.body;

  if (!leave_request_id || !approver_employee_id || !approver_cinema_cluster_id) {
    return res.status(400).json({ 
      error: "Thiếu thông tin người duyệt" 
    });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // Kiểm tra đơn nghỉ phép
    const [leaveCheck] = await connection.query(
      `SELECT status FROM leave_request WHERE id = ?`,
      [leave_request_id]
    );

    if (leaveCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Không tìm thấy đơn nghỉ phép" });
    }

    if (leaveCheck[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ 
        error: "Đơn đã được xử lý" 
      });
    }

    // Lấy approver_id
    const [approverCheck] = await connection.query(
      `SELECT id FROM employee_cinema_cluster 
       WHERE employee_id = ? AND cinema_cluster_id = ?`,
      [approver_employee_id, approver_cinema_cluster_id]
    );

    if (approverCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Người duyệt không hợp lệ" });
    }

    const approver_id = approverCheck[0].id;

    // Cập nhật trạng thái
    await connection.query(
      `UPDATE leave_request 
       SET status = 'rejected', 
           approver_id = ?, 
           rejection_reason = ?,
           approved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [approver_id, rejection_reason, leave_request_id]
    );

    await connection.commit();

    res.status(200).json({ 
      message: "Từ chối đơn nghỉ phép thành công" 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    connection.release();
  }
};

// 7. Hủy đơn nghỉ phép (bởi nhân viên)
export const cancelLeaveRequest = async (req, res) => {
  const { leave_request_id } = req.params;
  const { employee_id, cinema_cluster_id } = req.body;

  if (!leave_request_id || !employee_id || !cinema_cluster_id) {
    return res.status(400).json({ 
      error: "Thiếu thông tin" 
    });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // Kiểm tra quyền sở hữu
    const [leaveCheck] = await connection.query(
      `SELECT lr.*, ecc.employee_id
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       WHERE lr.id = ? AND ecc.employee_id = ? AND lr.cinema_cluster_id = ?`,
      [leave_request_id, employee_id, cinema_cluster_id]
    );

    if (leaveCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: "Không tìm thấy đơn nghỉ phép hoặc bạn không có quyền" 
      });
    }

    const leaveRequest = leaveCheck[0];

    if (leaveRequest.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ 
        error: "Đơn đã bị hủy" 
      });
    }

    // Không cho hủy đơn đã duyệt
    if (leaveRequest.status === 'approved') {
      await connection.rollback();
      return res.status(400).json({ 
        error: "Không thể hủy đơn đã được duyệt. Vui lòng liên hệ quản lý." 
      });
    }

    // Cập nhật trạng thái
    await connection.query(
      `UPDATE leave_request 
       SET status = 'cancelled' 
       WHERE id = ?`,
      [leave_request_id]
    );

    await connection.commit();

    res.status(200).json({ 
      message: "Hủy đơn nghỉ phép thành công" 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error cancelling leave request:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    connection.release();
  }
};

// 8. Lấy thống kê nghỉ phép
export const getLeaveStats = async (req, res) => {
  const { cinema_cluster_id } = req.params;
  const { start_date, end_date, employee_id } = req.query;

  if (!cinema_cluster_id) {
    return res.status(400).json({ error: "cinema_cluster_id là bắt buộc" });
  }

  try {
    let conditions = ['lr.cinema_cluster_id = ?'];
    let params = [cinema_cluster_id];

    if (start_date) {
      conditions.push('lr.start_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('lr.end_date <= ?');
      params.push(end_date);
    }

    if (employee_id) {
      conditions.push('ecc.employee_id = ?');
      params.push(employee_id);
    }

    const whereClause = conditions.join(' AND ');

    const [stats] = await dbPool.query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN lr.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN lr.status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN lr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(CASE WHEN lr.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_requests,
        SUM(CASE WHEN lr.status = 'approved' THEN lr.total_days ELSE 0 END) as total_approved_days,
        SUM(CASE WHEN lr.leave_type = 'annual' THEN 1 ELSE 0 END) as annual_leave_count,
        SUM(CASE WHEN lr.leave_type = 'sick' THEN 1 ELSE 0 END) as sick_leave_count,
        SUM(CASE WHEN lr.leave_type = 'personal' THEN 1 ELSE 0 END) as personal_leave_count,
        SUM(CASE WHEN lr.leave_type = 'unpaid' THEN 1 ELSE 0 END) as unpaid_leave_count
       FROM leave_request lr
       JOIN employee_cinema_cluster ecc ON lr.employee_cinema_cluster_id = ecc.id
       WHERE ${whereClause}`,
      params
    );

    res.status(200).json(stats[0]);

  } catch (error) {
    console.error("Error fetching leave stats:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
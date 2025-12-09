import dbPool from '../config/mysqldb.js';

// Lấy danh sách user có role manager hoặc employee
export const getAllManagersAndEmployees = async (req, res) => {
  try {
    const [users] = await dbPool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.profilePicture,
        u.isOnline,
        u.is_active,
        u.created_at,
        CASE 
          WHEN u.role = 'employee' THEN ecc.cinema_cluster_id
          WHEN u.role = 'manager' THEN cc.id
          ELSE NULL
        END as cinema_id,
        CASE 
          WHEN u.role = 'employee' THEN cinema.name
          WHEN u.role = 'manager' THEN cc.name
          ELSE NULL
        END as cinema_name,
        CASE 
          WHEN u.role = 'employee' THEN ecc.position
          ELSE NULL
        END as position
      FROM users u
      LEFT JOIN employee_cinema_cluster ecc ON u.id = ecc.employee_id AND u.role = 'employee'
      LEFT JOIN cinema_clusters cinema ON ecc.cinema_cluster_id = cinema.id
      LEFT JOIN cinema_clusters cc ON u.id = cc.manager_id AND u.role = 'manager'
      WHERE u.role IN ('manager', 'employee')
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
};

// Lấy thông tin chi tiết một user
export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await dbPool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.profilePicture,
        u.isOnline,
        u.province_code,
        u.district_code,
        u.created_at,
        u.updated_at,
        CASE 
          WHEN u.role = 'employee' THEN ecc.cinema_cluster_id
          WHEN u.role = 'manager' THEN cc.id
          ELSE NULL
        END as cinema_id,
        CASE 
          WHEN u.role = 'employee' THEN cinema.name
          WHEN u.role = 'manager' THEN cc.name
          ELSE NULL
        END as cinema_name,
        CASE 
          WHEN u.role = 'employee' THEN ecc.position
          ELSE NULL
        END as position,
        CASE 
          WHEN u.role = 'employee' THEN ecc.start_date
          ELSE NULL
        END as start_date
      FROM users u
      LEFT JOIN employee_cinema_cluster ecc ON u.id = ecc.employee_id AND u.role = 'employee'
      LEFT JOIN cinema_clusters cinema ON ecc.cinema_cluster_id = cinema.id
      LEFT JOIN cinema_clusters cc ON u.id = cc.manager_id AND u.role = 'manager'
      WHERE u.id = ? AND u.role IN ('manager', 'employee')
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Error getting user detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng'
    });
  }
};

// Lấy danh sách rạp khả dụng
export const getAvailableCinemas = async (req, res) => {
  try {
    const [cinemas] = await dbPool.query(
      'SELECT id, name, address FROM cinema_clusters ORDER BY name ASC'
    );

    res.status(200).json({
      success: true,
      data: cinemas
    });
  } catch (error) {
    console.error('Error getting available cinemas:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách rạp'
    });
  }
};

// Thay đổi vai trò user
export const changeUserRole = async (req, res) => {
  const conn = await dbPool.getConnection();
  
  try {
    const { userId } = req.params;
    const { newRole, cinemaId } = req.body;

    // Validate newRole
    if (!['manager', 'employee'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ. Chỉ có thể là manager hoặc employee'
      });
    }

    await conn.beginTransaction();

    // Lấy thông tin user hiện tại
    const [currentUser] = await conn.query(
      'SELECT role FROM users WHERE id = ? AND role IN ("manager", "employee")',
      [userId]
    );

    if (currentUser.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng hoặc người dùng không có quyền phù hợp'
      });
    }

    const oldRole = currentUser[0].role;

    // Nếu vai trò không thay đổi
    if (oldRole === newRole) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vai trò mới trùng với vai trò hiện tại'
      });
    }

    // Nếu đổi từ employee sang manager
    if (oldRole === 'employee' && newRole === 'manager') {
      // Xóa lịch làm việc trước
      await conn.query(`
        DELETE FROM schedule 
        WHERE employee_cinema_cluster_id IN (
          SELECT id FROM employee_cinema_cluster WHERE employee_id = ?
        )`,
        [userId]
      );

      // Xóa khỏi bảng employee_cinema_cluster
      await conn.query(
        'DELETE FROM employee_cinema_cluster WHERE employee_id = ?',
        [userId]
      );
    }

    // Nếu đổi từ manager sang employee
    if (oldRole === 'manager' && newRole === 'employee') {
      // Kiểm tra cinemaId có được cung cấp không
      if (!cinemaId) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn rạp để gán cho nhân viên'
        });
      }

      // Kiểm tra rạp có tồn tại không
      const [cinema] = await conn.query(
        'SELECT id, name FROM cinema_clusters WHERE id = ?',
        [cinemaId]
      );

      if (cinema.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Rạp không tồn tại'
        });
      }

      // Xóa manager_id của tất cả rạp mà manager này đang quản lý
      await conn.query(
        'UPDATE cinema_clusters SET manager_id = NULL WHERE manager_id = ?',
        [userId]
      );

      // Thêm vào employee_cinema_cluster với vị trí Staff
      await conn.query(`
        INSERT INTO employee_cinema_cluster 
        (employee_id, cinema_cluster_id, position, start_date) 
        VALUES (?, ?, 'Staff', CURDATE())`,
        [userId, cinemaId]
      );

      // Cập nhật role
      await conn.query(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        [newRole, userId]
      );

      await conn.commit();

      return res.status(200).json({
        success: true,
        message: `Đã chuyển vai trò từ ${oldRole} sang ${newRole} thành công. User đã được thêm vào rạp "${cinema[0].name}" với vị trí Staff.`,
        cinema: cinema[0]
      });
    }

    // Cập nhật role cho trường hợp còn lại
    await conn.query(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
      [newRole, userId]
    );

    await conn.commit();

    res.status(200).json({
      success: true,
      message: `Đã chuyển vai trò từ ${oldRole} sang ${newRole} thành công`
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error changing user role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi vai trò người dùng'
    });
  } finally {
    conn.release();
  }
};

// Vô hiệu hóa/Kích hoạt tài khoản
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'activate' hoặc 'deactivate'

    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action không hợp lệ. Chỉ có thể là activate hoặc deactivate'
      });
    }

    // Lấy thông tin user
    const [users] = await dbPool.query(
      'SELECT role, email, is_active FROM users WHERE id = ? AND role IN ("manager", "employee")',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const newStatus = action === 'activate' ? 1 : 0;

    await dbPool.query(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, userId]
    );

    res.status(200).json({
      success: true,
      message: action === 'activate' ? 'Đã kích hoạt tài khoản thành công' : 'Đã vô hiệu hóa tài khoản thành công'
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái tài khoản'
    });
  }
};

// Xóa vĩnh viễn tài khoản (hard delete)
export const deleteUser = async (req, res) => {
  const conn = await dbPool.getConnection();
  
  try {
    const { userId } = req.params;

    await conn.beginTransaction();

    // Kiểm tra user có tồn tại không
    const [users] = await conn.query(
      'SELECT role FROM users WHERE id = ? AND role IN ("manager", "employee")',
      [userId]
    );

    if (users.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Nếu là manager, kiểm tra có đang quản lý rạp không
    if (users[0].role === 'manager') {
      const [managedCinemas] = await conn.query(
        'SELECT id, name FROM cinema_clusters WHERE manager_id = ?',
        [userId]
      );

      if (managedCinemas.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Không thể xóa vì đang quản lý ${managedCinemas.length} rạp. Vui lòng chuyển quyền quản lý trước.`,
          cinemas: managedCinemas
        });
      }
    }

    // Nếu là employee, xóa lịch làm việc và khỏi employee_cinema_cluster trước
    if (users[0].role === 'employee') {
      // Xóa lịch làm việc
      await conn.query(`
        DELETE FROM schedule 
        WHERE employee_cinema_cluster_id IN (
          SELECT id FROM employee_cinema_cluster WHERE employee_id = ?
        )`,
        [userId]
      );

      // Xóa khỏi employee_cinema_cluster
      await conn.query(
        'DELETE FROM employee_cinema_cluster WHERE employee_id = ?',
        [userId]
      );
    }

    // Xóa user
    await conn.query('DELETE FROM users WHERE id = ?', [userId]);

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Đã xóa người dùng thành công'
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng'
    });
  } finally {
    conn.release();
  }
};

// Kiểm tra trạng thái tài khoản
export const checkUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await dbPool.query(
      'SELECT email, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isActive: users[0].is_active === 1,
        email: users[0].email
      }
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái tài khoản'
    });
  }
};

// Lấy danh sách rạp mà manager đang quản lý
export const getManagerCinemas = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra user có phải manager không
    const [users] = await dbPool.query(
      'SELECT role FROM users WHERE id = ? AND role = "manager"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy manager'
      });
    }

    // Lấy danh sách rạp
    const [cinemas] = await dbPool.query(
      'SELECT id, name, address, phone FROM cinema_clusters WHERE manager_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: cinemas
    });

  } catch (error) {
    console.error('Error getting manager cinemas:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách rạp'
    });
  }
};

// Chuyển manager sang employee với cinema cụ thể
export const changeManagerToEmployeeWithCinema = async (req, res) => {
  const conn = await dbPool.getConnection();
  
  try {
    const { userId } = req.params;
    const { cinemaId } = req.body;

    if (!cinemaId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn rạp'
      });
    }

    await conn.beginTransaction();

    // Kiểm tra user có phải manager và có quản lý rạp này không
    const [managedCinemas] = await conn.query(
      'SELECT id, name FROM cinema_clusters WHERE manager_id = ? AND id = ?',
      [userId, cinemaId]
    );

    if (managedCinemas.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Manager này không quản lý rạp được chọn'
      });
    }

    const cinemaName = managedCinemas[0].name;

    // Thêm vào employee_cinema_cluster với vị trí Staff
    await conn.query(`
      INSERT INTO employee_cinema_cluster 
      (employee_id, cinema_cluster_id, position, start_date) 
      VALUES (?, ?, 'Staff', CURDATE())`,
      [userId, cinemaId]
    );

    // Cập nhật role
    await conn.query(
      'UPDATE users SET role = "employee", updated_at = NOW() WHERE id = ?',
      [userId]
    );

    await conn.commit();

    res.status(200).json({
      success: true,
      message: `Đã chuyển vai trò từ manager sang employee thành công. User đã được thêm vào rạp "${cinemaName}" với vị trí Staff.`
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error changing manager to employee:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi vai trò người dùng'
    });
  } finally {
    conn.release();
  }
};
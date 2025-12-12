import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeManagement = ({ cinemaId }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [statistics, setStatistics] = useState({
    total_employees: 0,
    total_active: 0,
    total_inactive: 0,
    total_clusters: 0
  });
  const [clusters, setClusters] = useState([]);
  const [provinces, setProvinces] = useState([]);        // Danh sách tỉnh
  const [districts, setDistricts] = useState([]);        // Danh sách huyện theo tỉnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [newEmployee, setNewEmployee] = useState({
    fullName: '', 
    email: '', 
    phone: '', 
    province_code: '', 
    district_code: '',
    cinema_cluster_id: '', 
    position: 'Staff', 
    start_date: '', 
    end_date: ''
  });

  const [updateData, setUpdateData] = useState({
    position: '',
    end_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const cinemaClusterId = cinemaId;

  // ==================== FETCH DATA ====================
  const fetchClusters = async () => {
    try {
      const res = await axios.get(`/api/employee/cinema-cluster/${cinemaClusterId}`);
      setClusters(res.data);
    } catch (err) {
      setError("Không thể tải danh sách cụm rạp");
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/employee/cinema-cluster/${cinemaClusterId}`);
      setEmployees(res.data);
      setFilteredEmployees(res.data);
    } catch (err) {
      setError("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await axios.get("/api/employee/statistics");
      setStatistics(res.data.summary);
    } catch (err) {
      setError("Không thể tải thống kê nhân viên");
    }
  };

  // Fetch Tỉnh/Thành
  const fetchProvinces = async () => {
    try {
      const res = await axios.get('/api/location/provinces');
      setProvinces(res.data); // [{ code: "01", name: "TP. Hồ Chí Minh" }, ...]
    } catch (err) {
      console.error("Lỗi tải tỉnh:", err);
      setError("Không thể tải danh sách tỉnh/thành");
    }
  };

  // Fetch Huyện theo Tỉnh
  const fetchDistricts = async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    try {
      const res = await axios.get(`/api/location/districts/${provinceCode}`);
      setDistricts(res.data); // [{ code: "001", name: "Quận 1" }, ...]
    } catch (err) {
      console.error("Lỗi tải huyện:", err);
      setDistricts([]);
    }
  };

  // ==================== FILTER ====================
  const filterEmployees = () => {
    let filtered = [...employees];

    if (positionFilter) {
      filtered = filtered.filter(emp => emp.position === positionFilter);
    }

    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(emp => !emp.end_date);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(emp => emp.end_date);
      }
    }

    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      filterEmployees();
    }, 300);
    return () => clearTimeout(timer);
  }, [positionFilter, statusFilter, employees]);

  // ==================== HANDLE PROVINCE CHANGE ====================
  const handleProvinceChange = (e) => {
    const provinceCode = e.target.value;
    setNewEmployee({
      ...newEmployee,
      province_code: provinceCode,
      district_code: '' // Reset huyện khi đổi tỉnh
    });
    fetchDistricts(provinceCode);
  };

  // ==================== ADD EMPLOYEE ====================
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const employeeData = {
        ...newEmployee,
        cinema_cluster_id: cinemaId,
      };
      await axios.post("/api/employee", employeeData);
      closeAddModal();
      fetchEmployees();
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.error || "Không thể thêm nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    setNewEmployee({
      fullName: '', email: '', phone: '', province_code: '', district_code: '',
      cinema_cluster_id: `${cinemaId}`, position: 'Staff', start_date: '', end_date: ''
    });
    setDistricts([]);
  };

  // ==================== UPDATE EMPLOYEE ====================
  const openUpdateModal = (employee) => {
    setSelectedEmployee(employee);
    setUpdateData({
      position: employee.position || "Staff",
      end_date: employee.end_date || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/employee/${selectedEmployee.id}`, updateData);
      setIsUpdateModalOpen(false);
      setSelectedEmployee(null);
      setUpdateData({ position: '', end_date: '' });
      fetchEmployees();
      fetchStatistics();
    } catch (err) {
      setError("Không thể cập nhật nhân viên");
    } finally {
      setLoading(false);
    }
  };

  // ==================== DELETE EMPLOYEE ====================
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      await axios.delete(`/api/employee/${id}`); // Sửa endpoint nếu cần
      fetchEmployees();
      fetchStatistics();
    } catch (err) {
      setError("Không thể xóa nhân viên");
    }
  };

  // ==================== INPUT HANDLERS ====================
  const handleNewEmployeeChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleUpdateChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handlePositionChange = (e) => setPositionFilter(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);

  // ==================== USE EFFECT ====================
  useEffect(() => {
    fetchClusters();
    fetchEmployees();
    fetchStatistics();
    fetchProvinces(); // Load tỉnh ngay khi mở trang
  }, [cinemaClusterId]);

  // ==================== LOADING SCREEN ====================
  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Quản lý Nhân viên</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-300 underline">Đóng</button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-900"><svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tổng nhân viên</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_employees}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-900"><svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đang làm việc</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_active}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-900"><svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đã nghỉ việc</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-4">
            <select value={positionFilter} onChange={handlePositionChange} className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả vị trí</option>
              <option value="Staff">Nhân viên</option>
              <option value="Manager">Quản lý</option>
              <option value="Supervisor">Giám sát</option>
            </select>
            <select value={statusFilter} onChange={handleStatusChange} className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã nghỉ việc</option>
            </select>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Thêm nhân viên
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vị trí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày bắt đầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày kết thúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cụm rạp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Không có nhân viên nào phù hợp</td></tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-white">{employee.employee_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{employee.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.position === 'Manager' ? 'bg-blue-900 text-blue-300' :
                          employee.position === 'Supervisor' ? 'bg-purple-900 text-purple-300' :
                          'bg-gray-900 text-gray-300'
                        }`}>
                          {employee.position || 'Staff'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{employee.start_date || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{employee.end_date ? employee.end_date : 'Đang làm việc'}</td>
                      <td className="px-6 py-4 text-sm text-white">{employee.cluster_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => openUpdateModal(employee)} className="text-blue-400 hover:text-blue-300 mr-3">Sửa</button>
                        <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-400 hover:text-red-300">Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== ADD MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 my-8">
            <h3 className="text-xl font-semibold text-white mb-5">Thêm nhân viên mới</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="fullName" placeholder="Họ và tên *" required value={newEmployee.fullName} onChange={handleNewEmployeeChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />

                <input type="email" name="email" placeholder="Email *" required value={newEmployee.email} onChange={handleNewEmployeeChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />

                <input type="tel" name="phone" placeholder="Số điện thoại *" required value={newEmployee.phone} onChange={handleNewEmployeeChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />

                {/* TỈNH/THÀNH */}
                <select name="province_code" value={newEmployee.province_code} onChange={handleProvinceChange} required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map(p => <option key={p.code} value={p.code} className="bg-gray-900">{p.name}</option>)}
                </select>

                {/* QUẬN/HUYỆN */}
                <select name="district_code" value={newEmployee.district_code} onChange={handleNewEmployeeChange} required
                  disabled={!newEmployee.province_code}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map(d => <option key={d.code} value={d.code} className="bg-gray-900">{d.name}</option>)}
                </select>

                <select name="position" value={newEmployee.position} onChange={handleNewEmployeeChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500">
                  <option value="Staff">Nhân viên quầy</option>
                  <option value="Projectionist">Nhân viên phòng chiếu</option>
                  <option value="Supervisor">Giám sát</option>
                  <option value="Manager">Quản lý</option>
                </select>

                <input type="date" name="start_date" value={newEmployee.start_date} onChange={handleNewEmployeeChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />

                <input type="date" name="end_date" value={newEmployee.end_date} onChange={handleNewEmployeeChange} placeholder="Ngày nghỉ (nếu có)"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeAddModal}
                  className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Đang thêm...' : 'Thêm nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== UPDATE MODAL ==================== */}
      {isUpdateModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-5">Cập nhật nhân viên</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tên nhân viên</label>
                <input type="text" value={selectedEmployee.employee_name} disabled className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-400" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vị trí</label>
                <select name="position" value={updateData.position} onChange={handleUpdateChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500">
                  <option value="Staff">Nhân viên</option>
                  <option value="Manager">Quản lý</option>
                  <option value="Supervisor">Giám sát</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ngày nghỉ việc (để trống nếu đang làm)</label>
                <input type="date" name="end_date" value={updateData.end_date} onChange={handleUpdateChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)}
                  className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
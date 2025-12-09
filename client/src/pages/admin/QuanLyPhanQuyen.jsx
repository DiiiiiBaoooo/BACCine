import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, ToggleLeft, ToggleRight, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const QuanLyPhanQuyen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [loadingCinemas, setLoadingCinemas] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/pq/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      showAlert('error', 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ show: true, type, message: msg });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const fetchCinemas = async () => {
    setLoadingCinemas(true);
    try {
      const res = await axios.get('/api/pq/cinemas/available');
      if (res.data.success) setCinemas(res.data.data);
    } catch (err) {
      showAlert('error', 'Lỗi tải rạp');
    } finally {
      setLoadingCinemas(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    if (selectedUser.role === 'manager' && newRole === 'employee' && !selectedCinemaId) {
      return showAlert('error', 'Vui lòng chọn rạp');
    }
    try {
      await axios.put(`/api/pq/users/${userId}/change-role`, {
        newRole,
        cinemaId: newRole === 'employee' ? selectedCinemaId : null
      });
      showAlert('success', 'Cập nhật thành công');
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Lỗi');
    }
  };

  const toggleStatus = async (userId, action) => {
    try {
      await axios.put(`/api/pq/users/${userId}/toggle-status`, { action });
      showAlert('success', 'Cập nhật trạng thái thành công');
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      showAlert('error', 'Lỗi');
    }
  };

  const openModal = async (type, user) => {
    setModalType(type);
    setSelectedUser(user);
    setSelectedCinemaId('');
    if (type === 'changeRole' && user.role === 'manager') await fetchCinemas();
    setShowModal(true);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cinema_name && u.cinema_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Alert */}
      {alert.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg flex items-center gap-2 shadow-xl ${
          alert.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-medium`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {alert.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-9 h-9 text-red-600" />
          <h1 className="text-2xl font-bold">Quản Lý Phân Quyền</h1>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 text-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/70 backdrop-blur border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-red-600/10 border-b border-gray-800">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Người dùng</th>
                <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Rạp</th>
                <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Vai trò</th>
                <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Trạng thái</th>
                <th className="px-5 py-4 text-center text-sm font-medium text-gray-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.profilePicture || '/avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {user.cinema_name || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'manager' 
                        ? 'bg-red-600/20 text-red-400 border border-red-600/50' 
                        : 'bg-gray-800 text-gray-300'
                    }`}>
                      {user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.is_active === 0 
                        ? 'bg-red-600/20 text-red-400' 
                        : 'bg-green-600/20 text-green-400'
                    }`}>
                      {user.is_active === 0 ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openModal('changeRole', user)} className="p-2 hover:bg-red-600/20 rounded-lg transition">
                        <Edit2 size={18} className="text-red-500" />
                      </button>
                      <button onClick={() => openModal('toggleStatus', user)} className="p-2 hover:bg-yellow-600/20 rounded-lg transition">
                        {user.is_active === 0 ? 
                          <ToggleRight size={18} className="text-green-500" /> : 
                          <ToggleLeft size={18} className="text-yellow-500" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">Không có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white">
              {modalType === 'changeRole' ? 'Đổi vai trò' : selectedUser.is_active === 0 ? 'Kích hoạt tài khoản' : 'Khóa tài khoản'}
            </h3>

            {modalType === 'changeRole' && selectedUser.role === 'manager' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Chọn rạp <span className="text-red-500">*</span></label>
                <select
                  value={selectedCinemaId}
                  onChange={e => setSelectedCinemaId(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">-- Chọn rạp --</option>
                  {cinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {modalType === 'changeRole' ? (
                <>
                  <button
                    onClick={() => changeRole(selectedUser.id, 'manager')}
                    disabled={selectedUser.role === 'manager'}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-medium transition"
                  >
                    Quản lý
                  </button>
                  <button
                    onClick={() => changeRole(selectedUser.id, 'employee')}
                    disabled={selectedUser.role === 'employee'}
                    className="flex-1 py-3 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-medium transition"
                  >
                    Nhân viên
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleStatus(selectedUser.id, selectedUser.is_active === 0 ? 'activate' : 'deactivate')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    selectedUser.is_active === 0 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {selectedUser.is_active === 0 ? 'Kích hoạt' : 'Khóa tài khoản'}
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyPhanQuyen;
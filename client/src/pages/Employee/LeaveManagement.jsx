import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Clock, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import axios from 'axios';

const LeaveManagement = ({ employeeId, cinemaClusterId }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch dữ liệu
  useEffect(() => {
    console.log("id nhan vien", employeeId);

    if (employeeId && cinemaClusterId) {
      fetchLeaveRequests();
    }
  }, [employeeId, cinemaClusterId]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leave/employee/${employeeId}/${cinemaClusterId}`);
      
      setLeaveRequests(data.leave_requests || []);
      setLeaveBalance(data.leave_balance || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Gửi đơn nghỉ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/api/leave/create', {
        employee_id: employeeId,
        cinema_cluster_id: cinemaClusterId,
        ...formData
      });

      setSuccess('Tạo đơn nghỉ phép thành công!');
      setShowForm(false);
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tạo đơn');
    } finally {
      setLoading(false);
    }
  };

  // Hủy đơn
  const handleCancel = async (leaveRequestId) => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;

    setLoading(true);
    try {
      await axios.patch(`/api/leave/cancel/${leaveRequestId}`, {
        employee_id: employeeId,
        cinema_cluster_id: cinemaClusterId
      });

      setSuccess('Đã hủy đơn nghỉ phép');
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể hủy đơn');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'CHỜ DUYỆT', color: 'bg-yellow-900 text-yellow-300 border-yellow-700' },
      approved: { label: 'ĐÃ DUYỆT', color: 'bg-green-900 text-green-300 border-green-700' },
      rejected: { label: 'TỪ CHỐI', color: 'bg-red-900 text-red-300 border-red-700' },
      cancelled: { label: 'ĐÃ HỦY', color: 'bg-gray-800 text-gray-400 border-gray-700' }
    };
    const { label, color } = map[status] || map.pending;
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${color}`}>{label}</span>;
  };

  const getLeaveTypeLabel = (type) => {
    const map = {
      annual: 'PHÉP NĂM',
      sick: 'ỐM ĐAU',
      personal: 'CÁ NHÂN',
      unpaid: 'KHÔNG LƯƠNG'
    };
    return map[type] || type.toUpperCase();
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '--';

  return (
    <div className="bg-zinc-900 border border-red-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-red-500">QUẢN LÝ NGHỈ PHÉP</h2>
          <p className="text-gray-400 text-sm">Đơn xin nghỉ phép của bạn</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
        >
          <Plus className="w-5 h-5" /> TẠO ĐƠN MỚI
        </button>
      </div>

      {/* Số dư phép */}
      {leaveBalance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-red-900 rounded-lg p-4">
            <div className="text-xs text-gray-400">TỔNG PHÉP NĂM</div>
            <div className="text-2xl font-bold text-blue-400">{leaveBalance.annual_leave_total}</div>
          </div>
          <div className="bg-black/40 border border-red-900 rounded-lg p-4">
            <div className="text-xs text-gray-400">ĐÃ DÙNG</div>
            <div className="text-2xl font-bold text-red-400">{leaveBalance.annual_leave_used}</div>
          </div>
          <div className="bg-black/40 border border-red-900 rounded-lg p-4">
            <div className="text-xs text-gray-400">CÒN LẠI</div>
            <div className="text-2xl font-bold text-green-400">{leaveBalance.annual_leave_remaining}</div>
          </div>
          <div className="bg-black/40 border border-red-900 rounded-lg p-4">
            <div className="text-xs text-gray-400">NGHỈ ỐM</div>
            <div className="text-2xl font-bold text-purple-400">{leaveBalance.sick_leave_used}</div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-950/70 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-950/70 border border-green-700 text-green-300 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {success}
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : leaveRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có đơn nghỉ phép nào</div>
      ) : (
        <div className="space-y-3">
          {leaveRequests.map((req) => (
            <div key={req.id} className="bg-black/40 border border-red-900 rounded-lg p-4 hover:bg-red-950/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-900/40 text-red-300 rounded-lg text-xs font-bold">
                      {getLeaveTypeLabel(req.leave_type)}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(req.start_date)} → {formatDate(req.end_date)}
                    </span>
                    <span className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      {req.total_days} ngày
                    </span>
                  </div>

                  {req.reason && (
                    <div className="flex items-start gap-2 text-sm text-gray-400">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <span>{req.reason}</span>
                    </div>
                  )}

                  {req.rejection_reason && (
                    <div className="bg-red-950/50 border border-red-800 rounded p-3 text-sm">
                      <div className="font-bold text-red-400 mb-1">Lý do từ chối:</div>
                      <div className="text-gray-300">{req.rejection_reason}</div>
                    </div>
                  )}

                  {req.approver_name && (
                    <div className="text-xs text-gray-500">
                      Người duyệt: {req.approver_name} • {formatDate(req.approved_at)}
                    </div>
                  )}
                </div>

                {req.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-sm font-medium"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-red-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-red-500">TẠO ĐƠN NGHỈ PHÉP</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="w-6 h-6 text-red-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Loại nghỉ phép *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-red-800 rounded text-white"
                >
                  <option value="annual">Phép năm</option>
                  <option value="sick">Ốm đau</option>
                  <option value="personal">Cá nhân</option>
                  <option value="unpaid">Không lương</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Từ ngày *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-red-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Đến ngày *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-red-800 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lý do</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-red-800 rounded text-white h-24 resize-none"
                  placeholder="Nhập lý do nghỉ phép..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg font-bold"
                >
                  {loading ? 'Đang gửi...' : 'GỬI ĐƠN'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
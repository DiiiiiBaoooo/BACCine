import React, { useState, useEffect } from 'react';
import { Filter, Download, X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar, FileText, Clock } from 'lucide-react';
import axios from 'axios';

const AttendanceHistory = ({ cinemaClusterId, managerId }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Attendance states
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', search_name: '', status: '', shift_type: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Leave states
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const API = '/api/schedule';

  // ============ ATTENDANCE FUNCTIONS ============
  const fetchHistory = async (page = 1) => {
    if (!cinemaClusterId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: '20', ...filters });
      const res = await axios.get(`${API}/attendance/history/${cinemaClusterId}?${params}`);
      setHistory(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!cinemaClusterId) return;
    try {
      const params = new URLSearchParams(Object.fromEntries(
        Object.entries(filters).filter(([k, v]) => v && ['start_date', 'end_date'].includes(k))
      ));
      const res = await axios.get(`${API}/attendance/stats/${cinemaClusterId}?${params}`);
      setStats(res.data);
    } catch (err) {}
  };

  const handleExport = () => {
    const params = new URLSearchParams(filters);
    window.open(`${API}/attendance/export/${cinemaClusterId}?${params}`, '_blank');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', search_name: '', status: '', shift_type: '' });
  };

  // ============ LEAVE FUNCTIONS ============
  const fetchLeaveRequests = async () => {
    if (!cinemaClusterId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/leave/cluster/${cinemaClusterId}?status=pending`);
      setLeaveRequests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    if (!cinemaClusterId) return;
    try {
      const res = await axios.get(`/api/leave/stats/${cinemaClusterId}`);
      setLeaveStats(res.data);
    } catch (err) {}
  };

  const handleApprove = async (leaveRequestId) => {
    if (!window.confirm('Xác nhận duyệt đơn nghỉ phép này?')) return;

    try {
      await axios.patch(`/api/leave/approve/${leaveRequestId}`, {
        approver_employee_id: managerId,
        approver_cinema_cluster_id: cinemaClusterId
      });

      alert('Đã duyệt đơn nghỉ phép!');
      fetchLeaveRequests();
      fetchLeaveStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi duyệt đơn');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      await axios.patch(`/api/leave/reject/${selectedRequest.id}`, {
        approver_employee_id: managerId,
        approver_cinema_cluster_id: cinemaClusterId,
        rejection_reason: rejectionReason
      });

      alert('Đã từ chối đơn nghỉ phép!');
      setShowRejectForm(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchLeaveRequests();
      fetchLeaveStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi từ chối đơn');
    }
  };

  // ============ EFFECTS ============
  useEffect(() => {
    if (cinemaClusterId) {
      if (activeTab === 'attendance') {
        fetchHistory(1);
        fetchStats();
      } else {
        fetchLeaveRequests();
        fetchLeaveStats();
      }
    }
  }, [cinemaClusterId, activeTab, filters]);

  // ============ HELPERS ============
  const getStatusBadge = (s) => {
    const map = {
      completed: ['HOÀN THÀNH', 'bg-green-900 text-green-300 border-green-700'],
      absent: ['VẮNG', 'bg-red-900 text-red-300 border-red-700'],
      confirmed: ['ĐÃ XÁC NHẬN', 'bg-blue-900 text-blue-300 border-blue-700'],
      pending: ['CHỜ', 'bg-yellow-900 text-yellow-300 border-yellow-700'],
      cancelled: ['HỦY', 'bg-gray-800 text-gray-400 border-gray-700'],
    };
    const [label, cls] = map[s] || ['CHỜ', 'bg-yellow-900 text-yellow-300 border-yellow-700'];
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${cls}`}>{label}</span>;
  };

  const getShiftLabel = (s) => ({ morning: 'SÁNG', afternoon: 'CHIỀU', evening: 'TỐI' })[s] || s?.toUpperCase();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '--';
  const formatTime = (m) => m ? `${Math.floor(m / 60)}h${m % 60 ? m % 60 + 'p' : ''}` : '--';

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* TABS */}
        <div className="flex gap-4 border-b border-red-800">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 rounded-t-lg font-bold transition-colors ${
              activeTab === 'attendance'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            LỊCH SỬ CHẤM CÔNG
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-6 py-3 rounded-t-lg font-bold transition-colors ${
              activeTab === 'leave'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            QUẢN LÝ NGHỈ PHÉP
          </button>
        </div>

        {/* ============ ATTENDANCE TAB ============ */}
        {activeTab === 'attendance' && (
          <>
            {/* Header + Stats */}
            <div className="bg-zinc-900 border border-red-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-2xl font-bold text-red-500">LỊCH SỬ CHẤM CÔNG</h1>
                  <p className="text-gray-500 text-sm">Quản lý nhân viên rạp phim</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-red-800 rounded-lg text-sm font-medium">
                    <Filter className="w-4 h-4" /> Bộ lọc
                  </button>
                  <button onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold">
                    <Download className="w-4 h-4" /> Excel
                  </button>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'TỔNG CA', value: stats.total_shifts || 0, color: 'text-red-400' },
                    { label: 'HOÀN THÀNH', value: stats.completed_shifts || 0, color: 'text-green-400' },
                    { label: 'VẮNG', value: stats.absent_shifts || 0, color: 'text-red-400' },
                    { label: 'TỔNG GIỜ', value: `${Math.round(stats.total_work_hours || 0)}h`, color: 'text-purple-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-black/40 border border-red-900 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-400">{s.label}</div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-zinc-900 border border-red-800 rounded-xl p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <input type="date" value={filters.start_date} onChange={e => handleFilterChange('start_date', e.target.value)}
                    className="px-3 py-2 bg-black border border-red-800 rounded text-sm" />
                  <input type="date" value={filters.end_date} onChange={e => handleFilterChange('end_date', e.target.value)}
                    className="px-3 py-2 bg-black border border-red-800 rounded text-sm" />
                  <input type="text" placeholder="Tên NV..." value={filters.search_name}
                    onChange={e => handleFilterChange('search_name', e.target.value)}
                    className="px-3 py-2 bg-black border border-red-800 rounded text-sm" />
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                    className="px-3 py-2 bg-black border border-red-800 rounded text-sm">
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="absent">Vắng</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="pending">Chờ</option>
                  </select>
                  <select value={filters.shift_type} onChange={e => handleFilterChange('shift_type', e.target.value)}
                    className="px-3 py-2 bg-black border border-red-800 rounded text-sm">
                    <option value="">Tất cả ca</option>
                    <option value="morning">Sáng</option>
                    <option value="afternoon">Chiều</option>
                    <option value="evening">Tối</option>
                  </select>
                </div>
                <button onClick={clearFilters}
                  className="mt-4 text-red-400 text-sm hover:text-red-300 flex items-center gap-1">
                  <X className="w-4 h-4" /> Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-950/70 border border-red-700 text-red-300 p-4 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-zinc-900 border border-red-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-red-950 to-black">
                    <tr>
                      {['Nhân viên', 'Ngày', 'Ca', 'Vào', 'Ra', 'Giờ', 'Trạng thái', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-red-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-950">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-500">Đang tải...</td></tr>
                    ) : history.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-500">Không có dữ liệu</td></tr>
                    ) : history.map((r) => (
                      <tr key={r.id} className="hover:bg-red-950/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.employee_name}</div>
                          <div className="text-xs text-gray-500">{r.employee_email}</div>
                        </td>
                        <td className="px-4 py-3">{formatDate(r.shift_date)}</td>
                        <td className="px-4 py-3 font-bold text-red-400">{getShiftLabel(r.shift_type)}</td>
                        <td className="px-4 py-3 text-green-400">{r.start_time || '--'}</td>
                        <td className="px-4 py-3 text-red-400">{r.end_time || '--'}</td>
                        <td className="px-4 py-3 font-bold">{formatTime(r.work_duration_minutes)}</td>
                        <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedRecord(r)}
                            className="text-red-400 hover:text-white text-sm font-medium">Chi tiết</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-black px-4 py-3 flex items-center justify-between text-sm border-t border-red-900">
                  <span className="text-gray-400">Trang {pagination.page} / {pagination.totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchHistory(pagination.page - 1)} disabled={pagination.page === 1}
                      className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 rounded flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Trước
                    </button>
                    <button onClick={() => fetchHistory(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 rounded flex items-center gap-1">
                      Sau <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal chi tiết */}
            {selectedRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedRecord(null)}>
                <div className="bg-zinc-900 border-2 border-red-800 rounded-xl max-w-2xl w-full p-6"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-red-500">CHI TIẾT CHẤM CÔNG</h3>
                    <button onClick={() => setSelectedRecord(null)}><X className="w-6 h-6 text-red-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Nhân viên:</span> <span className="font-bold text-white">{selectedRecord.employee_name}</span></div>
                    <div><span className="text-gray-400">Email:</span> {selectedRecord.employee_email}</div>
                    <div><span className="text-gray-400">Ngày:</span> {formatDate(selectedRecord.shift_date)}</div>
                    <div><span className="text-gray-400">Ca:</span> <span className="text-red-400 font-bold">{getShiftLabel(selectedRecord.shift_type)}</span></div>
                    <div><span className="text-gray-400">Check-in:</span> <span className="text-green-400">{selectedRecord.start_time || 'Chưa'}</span></div>
                    <div><span className="text-gray-400">Check-out:</span> <span className="text-red-400">{selectedRecord.end_time || 'Chưa'}</span></div>
                    <div><span className="text-gray-400">Tổng giờ:</span> <span className="font-bold">{formatTime(selectedRecord.work_duration_minutes)}</span></div>
                    <div className="col-span-2 mt-3">{getStatusBadge(selectedRecord.status)}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ LEAVE TAB ============ */}
        {activeTab === 'leave' && (
          <>
            {/* Stats */}
            {leaveStats && (
              <div className="bg-zinc-900 border border-red-800 rounded-xl p-5">
                <h2 className="text-xl font-bold text-red-500 mb-4">THỐNG KÊ NGHỈ PHÉP</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'CHỜ DUYỆT', value: leaveStats.pending_requests || 0, color: 'text-yellow-400' },
                    { label: 'ĐÃ DUYỆT', value: leaveStats.approved_requests || 0, color: 'text-green-400' },
                    { label: 'TỪ CHỐI', value: leaveStats.rejected_requests || 0, color: 'text-red-400' },
                    { label: 'TỔNG NGÀY', value: leaveStats.total_approved_days || 0, color: 'text-purple-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-black/40 border border-red-900 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-400">{s.label}</div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-950/70 border border-red-700 text-red-300 p-4 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Danh sách đơn chờ duyệt */}
            <div className="bg-zinc-900 border border-red-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-red-950 to-black">
                <h2 className="text-lg font-bold text-red-300">ĐƠN CHỜ DUYỆT</h2>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Đang tải...</div>
              ) : leaveRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Không có đơn nào chờ duyệt</div>
              ) : (
                <div className="divide-y divide-red-950">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-red-950/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-lg">{req.employee_name}</span>
                            <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-bold border border-yellow-700">CHỜ DUYỆT</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDate(req.start_date)} → {formatDate(req.end_date)}
                            </span>
                            <span className="flex items-center gap-2 text-red-400 font-bold">
                              <Clock className="w-4 h-4" />
                              {req.total_days} ngày
                            </span>
                          </div>

                          {req.reason && (
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="w-4 h-4 mt-0.5 text-gray-400" />
                              <div className="text-gray-300 bg-black/30 p-3 rounded flex-1">
                                <span className="text-gray-500">Lý do: </span>{req.reason}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Ảnh hưởng: <span className="text-red-400 font-bold">{req.affected_shifts_count} ca làm việc</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded flex items-center gap-2 font-bold whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" /> DUYỆT
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowRejectForm(true);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded flex items-center gap-2 font-bold whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" /> TỪ CHỐI
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form từ chối */}
            {showRejectForm && selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border-2 border-red-800 rounded-xl max-w-lg w-full p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-red-500">TỪ CHỐI ĐƠN NGHỈ PHÉP</h3>
                    <button onClick={() => setShowRejectForm(false)}>
                      <X className="w-6 h-6 text-red-400 hover:text-white" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-black/40 border border-red-900 p-4 rounded">
                      <div className="font-bold text-white mb-2">{selectedRequest.employee_name}</div>
                      <div className="text-sm text-gray-400">
                        {formatDate(selectedRequest.start_date)} → {formatDate(selectedRequest.end_date)}
                        <span className="ml-2 text-red-400 font-bold">({selectedRequest.total_days} ngày)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Lý do từ chối *</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-4 py-2 bg-black border border-red-800 rounded text-white h-32 resize-none"
                        placeholder="Nhập lý do từ chối..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleReject}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
                      >
                        XÁC NHẬN TỪ CHỐI
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
import React, { useState, useEffect } from 'react';
import { Filter, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const AttendanceHistory = ({ cinemaClusterId }) => {
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

  const API = '/api/schedule';

  // Fetch data
  const fetchHistory = async (page = 1) => {
    if (!cinemaClusterId) return;
    setLoading(true); setError(null);
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
    } catch (err) { }
  };

  const handleExport = () => {
    const params = new URLSearchParams(filters);
    window.open(`${API}/attendance/export/${cinemaClusterId}?${params}`, '_blank');
  };

  useEffect(() => {
    if (cinemaClusterId) {
      fetchHistory(1);
      fetchStats();
    }
  }, [cinemaClusterId, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', search_name: '', status: '', shift_type: '' });
  };

  // Helper
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

  const getShiftLabel = (s) => ({ morning: 'SÁNG', afternoon: 'CHIỀU', evening: 'TỐI' })[s] || s.toUpperCase();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '--';
  const formatTime = (m) => m ? `${Math.floor(m / 60)}h${m % 60 ? m % 60 + 'p' : ''}` : '--';

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-5">

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

        {/* Modal chi tiết - nhỏ gọn */}
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
      </div>
    </div>
  );
};

export default AttendanceHistory;
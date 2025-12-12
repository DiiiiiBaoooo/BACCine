import React, { useState, useEffect } from 'react';
import { Filter, Download, X, CheckCircle, XCircle } from 'lucide-react';
import useAuthUser from '../../hooks/useAuthUser';

const QLNghiPhep = ({ cinemaClusterId }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leave'
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lấy manager info từ auth
  const {authUser}= useAuthUser();
    const managerId = authUser ? authUser.id : null;

  // Fetch đơn nghỉ phép
  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave/cluster/${cinemaClusterId}?status=pending`);
      const data = await res.json();
      setLeaveRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchLeaveStats = async () => {
    try {
      const res = await fetch(`/api/leave/stats/${cinemaClusterId}`);
      const data = await res.json();
      setLeaveStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'leave' && cinemaClusterId) {
      fetchLeaveRequests();
      fetchLeaveStats();
    }
  }, [activeTab, cinemaClusterId]);

  // Duyệt đơn
  const handleApprove = async (leaveRequestId) => {
    if (!confirm('Xác nhận duyệt đơn nghỉ phép này?')) return;

    try {
      const res = await fetch(`/api/leave/approve/${leaveRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_employee_id: managerId,
          approver_cinema_cluster_id: cinemaClusterId
        })
      });

      if (!res.ok) throw new Error('Lỗi duyệt đơn');

      alert('Đã duyệt đơn nghỉ phép!');
      fetchLeaveRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  // Từ chối đơn
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      const res = await fetch(`/api/leave/reject/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_employee_id: managerId,
          approver_cinema_cluster_id: cinemaClusterId,
          rejection_reason: rejectionReason
        })
      });

      if (!res.ok) throw new Error('Lỗi từ chối đơn');

      alert('Đã từ chối đơn nghỉ phép!');
      setShowRejectForm(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* TABS */}
        <div className="flex gap-4 border-b border-red-800 pb-4">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 rounded-t-lg font-bold ${
              activeTab === 'attendance'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            CHẤM CÔNG
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-6 py-3 rounded-t-lg font-bold ${
              activeTab === 'leave'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            NGHỈ PHÉP
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === 'attendance' ? (
          // Code chấm công hiện tại...
          <div>/* Attendance content */</div>
        ) : (
          <div className="space-y-5">
            {/* Stats */}
            {leaveStats && (
              <div className="bg-zinc-900 border border-red-800 rounded-xl p-5">
                <h2 className="text-xl font-bold text-red-500 mb-4">THỐNG KÊ NGHỈ PHÉP</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/40 border border-red-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400">CHỜ DUYỆT</div>
                    <div className="text-2xl font-bold text-yellow-400">{leaveStats.pending_requests || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-red-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400">ĐÃ DUYỆT</div>
                    <div className="text-2xl font-bold text-green-400">{leaveStats.approved_requests || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-red-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400">TỪ CHỐI</div>
                    <div className="text-2xl font-bold text-red-400">{leaveStats.rejected_requests || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-red-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400">TỔNG NGÀY</div>
                    <div className="text-2xl font-bold text-purple-400">{leaveStats.total_approved_days || 0}</div>
                  </div>
                </div>
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
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{req.employee_name}</span>
                            <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs font-bold">CHỜ DUYỆT</span>
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            {new Date(req.start_date).toLocaleDateString('vi-VN')} → {new Date(req.end_date).toLocaleDateString('vi-VN')}
                            <span className="ml-3 text-red-400 font-bold">({req.total_days} ngày)</span>
                          </div>

                          {req.reason && (
                            <div className="text-sm text-gray-300 bg-black/30 p-2 rounded">
                              Lý do: {req.reason}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Ảnh hưởng: {req.affected_shifts_count} ca làm việc
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded flex items-center gap-2 font-bold"
                          >
                            <CheckCircle className="w-4 h-4" /> DUYỆT
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowRejectForm(true);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded flex items-center gap-2 font-bold"
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
                      <X className="w-6 h-6 text-red-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-black/40 p-4 rounded">
                      <div className="font-bold text-white mb-2">{selectedRequest.employee_name}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')} → 
                        {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default QLNghiPhep;
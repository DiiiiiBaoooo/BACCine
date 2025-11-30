import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const QuanLyPhongChieu = ({ cinemaId }) => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [statistics, setStatistics] = useState({
    total_rooms: 0,
    total_active: 0,
    total_maintenance: 0,
    total_closed: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    status: 'AVAILABLE',
    type: '2D',
    cinema_clusters_id: cinemaId
  });
  const [updateData, setUpdateData] = useState({
    name: '',
    capacity: '',
    status: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Tính toán thống kê từ danh sách phòng
  const calculateStatistics = (roomList) => {
    const total_rooms = roomList.length;
    const total_active = roomList.filter(room => room.status === 'AVAILABLE').length;
    const total_maintenance = roomList.filter(room => room.status === 'Maintenance').length;
    const total_closed = roomList.filter(room => room.status === 'Closed').length;

    return {
      total_rooms,
      total_active,
      total_maintenance,
      total_closed
    };
  };

  // Fetch danh sách phòng chiếu
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/rooms/cinema/${cinemaId}`);
      if (response.data.success) {
        setRooms(response.data.rooms);
        setFilteredRooms(response.data.rooms);
        setStatistics(calculateStatistics(response.data.rooms));
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể tải danh sách phòng chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Lọc phòng chiếu theo trạng thái
  const filterRooms = () => {
    let filtered = [...rooms];
    if (statusFilter) {
      filtered = filtered.filter(room => room.status === statusFilter);
    }
    setFilteredRooms(filtered);
  };

  // Thêm phòng chiếu mới
  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/rooms", newRoom);
      if (response.data.success) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        setNewRoom({
          name: '',
          capacity: '',
          status: 'AVAILABLE',
          type: '2D',
          cinema_clusters_id: cinemaId
        });
        fetchRooms();
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể thêm phòng chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal cập nhật
  const openUpdateModal = async (room) => {
    setSelectedRoom(room);
    setUpdateData({
      name: room.name,
      capacity: room.capacity,
      status: room.status,
      type: room.type
    });
    setIsUpdateModalOpen(true);
  };

  // Cập nhật phòng chiếu
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(`/api/rooms/${selectedRoom.id}`, updateData);
      if (response.data.success) {
        toast.success(response.data.message);
        setIsUpdateModalOpen(false);
        setSelectedRoom(null);
        setUpdateData({ name: '', capacity: '', status: '', type: '' });
        fetchRooms();
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể cập nhật phòng chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xóa phòng chiếu
  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng chiếu này?")) return;
    try {
      const response = await axios.delete(`/api/rooms/${id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchRooms();
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể xóa phòng chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle input thêm mới
  const handleNewRoomChange = (e) => {
    setNewRoom({ ...newRoom, [e.target.name]: e.target.value });
  };

  // Handle input cập nhật
  const handleUpdateChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  // Handle filter status
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Debounced filter
  useEffect(() => {
    const timer = setTimeout(() => {
      filterRooms();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, rooms]);

  // Fetch dữ liệu khi component mount hoặc cinemaId thay đổi
  useEffect(() => {
    fetchRooms();
  }, [cinemaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Quản lý Phòng Chiếu</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-900">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tổng phòng chiếu</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_rooms}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-900">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Hoạt động</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_active}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-900">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Bảo trì</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_maintenance}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-900">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đóng cửa</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_closed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-4">
            <select 
              name="status" 
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-800">Tất cả trạng thái</option>
              <option value="AVAILABLE" className="bg-gray-800">Hoạt động</option>
              <option value="MAINTENANCE" className="bg-gray-800">Bảo trì</option>
              <option value="CLOSED" className="bg-gray-800">Đóng cửa</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Thêm phòng chiếu
          </button>
        </div>

        {/* Rooms Table */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tên phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sức chứa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Không có phòng chiếu nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {room.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {room.capacity} ghế
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {room.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          room.status === 'AVAILABLE' 
                            ? 'bg-green-900 text-green-300' 
                            : room.status === 'MAINTENANCE'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {room.status === 'AVAILABLE' ? 'Hoạt động' : 
                           room.status === 'MAINTENANCE' ? 'Bảo trì' : 'Đóng cửa'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(room)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Thêm phòng chiếu mới</h3>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Tên phòng chiếu *"
                    value={newRoom.name}
                    onChange={handleNewRoomChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="capacity"
                    placeholder="Sức chứa (số ghế) *"
                    value={newRoom.capacity}
                    onChange={handleNewRoomChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="type"
                    value={newRoom.type}
                    onChange={handleNewRoomChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2D" className="bg-gray-900">2D</option>
                    <option value="3D" className="bg-gray-900">3D</option>
                    <option value="IMAX" className="bg-gray-900">IMAX</option>
                  </select>
                  <select
                    name="status"
                    value={newRoom.status}
                    onChange={handleNewRoomChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AVAILABLE" className="bg-gray-900">Hoạt động</option>
                    <option value="MAINTENANCE" className="bg-gray-900">Bảo trì</option>
                    <option value="CLOSED" className="bg-gray-900">Đóng cửa</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang thêm...' : 'Thêm phòng chiếu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Room Modal */}
      {isUpdateModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Cập nhật thông tin phòng chiếu</h3>
              <form onSubmit={handleUpdateRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tên phòng chiếu</label>
                    <input
                      type="text"
                      name="name"
                      value={updateData.name}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Sức chứa</label>
                    <input
                      type="number"
                      name="capacity"
                      value={updateData.capacity}
                      onChange={handleUpdateChange}
                      min="1"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Loại</label>
                    <select
                      name="type"
                      value={updateData.type}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2D" className="bg-gray-900">2D</option>
                      <option value="3D" className="bg-gray-900">3D</option>
                      <option value="IMAX" className="bg-gray-900">IMAX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Trạng thái</label>
                    <select
                      name="status"
                      value={updateData.status}
                      onChange={handleUpdateChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE" className="bg-gray-900">Hoạt động</option>
                      <option value="MAINTENANCE" className="bg-gray-900">Bảo trì</option>
                      <option value="CLOSED" className="bg-gray-900">Đóng cửa</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdateModalOpen(false);
                      setSelectedRoom(null);
                      setUpdateData({ name: '', capacity: '', status: '', type: '' });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyPhongChieu;
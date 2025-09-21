import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuanLyDichVu = ({ cinemaId }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [statistics, setStatistics] = useState({
    total_services: 0,
    total_active: 0,
    total_inactive: 0,
    total_outofstock: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    status: 'active',
  });
  const [updateData, setUpdateData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    status: '',
  });
  const [newImage, setNewImage] = useState(null);
  const [updateImage, setUpdateImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');

  // Fetch dịch vụ
  const fetchServices = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const res = await axios.get(`/api/services/${cinemaId}`);
      if (res.data.success && Array.isArray(res.data.services)) {
        const fetchedServices = res.data.services;
        setServices(fetchedServices);
        setFilteredServices(fetchedServices); // Initially set filteredServices to all services
        calculateStatistics(fetchedServices);
      } else {
        throw new Error('Dữ liệu dịch vụ không hợp lệ từ máy chủ');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'Không thể tải danh sách dịch vụ'
      );
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê từ data
  const calculateStatistics = (data) => {
    const total = data.length;
    const active = data.filter((s) => s.status === 'active').length;
    const inactive = data.filter((s) => s.status === 'inactive').length;
    const outofstock = data.filter((s) => s.status === 'outofstock').length;

    setStatistics({
      total_services: total,
      total_active: active,
      total_inactive: inactive,
      total_outofstock: outofstock,
    });
  };

  // Lọc dịch vụ
  const filterServices = () => {
    let filtered = [...services];

    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    setFilteredServices(filtered);
  };

  // Thêm dịch vụ mới
  const handleAddService = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('cinema_id', cinemaId);
      formData.append('name', newService.name);
      formData.append('description', newService.description);
      formData.append('price', newService.price);
      formData.append('quantity', newService.quantity);
      formData.append('status', newService.status);
      if (newImage) {
        formData.append('image', newImage);
      }

      await axios.post('/api/services', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsModalOpen(false);
      setNewService({
        name: '',
        description: '',
        price: '',
        quantity: '',
        status: 'active',
      });
      setNewImage(null);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể thêm dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal update
  const openUpdateModal = (service) => {
    setSelectedService(service);
    setUpdateData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      quantity: service.quantity || '',
      status: service.status || 'active',
    });
    setIsUpdateModalOpen(true);
  };

  // Cập nhật dịch vụ
  const handleUpdateService = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', updateData.name);
      formData.append('description', updateData.description);
      formData.append('price', updateData.price);
      formData.append('quantity', updateData.quantity);
      formData.append('status', updateData.status);
      if (updateImage) {
        formData.append('image', updateImage);
      }

      await axios.put(`/api/services/${selectedService.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUpdateModalOpen(false);
      setSelectedService(null);
      setUpdateData({ name: '', description: '', price: '', quantity: '', status: '' });
      setUpdateImage(null);
      fetchServices();
    } catch (err) {
      setError('Không thể cập nhật dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Xóa dịch vụ
  const handleDeleteService = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    try {
      await axios.delete(`/api/services/${id}`);
      fetchServices();
    } catch (err) {
      setError('Không thể xóa dịch vụ');
    }
  };

  // Input thêm mới
  const handleNewServiceChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleNewImageChange = (e) => {
    setNewImage(e.target.files[0]);
  };

  // Input cập nhật
  const handleUpdateChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleUpdateImageChange = (e) => {
    setUpdateImage(e.target.files[0]);
  };

  // Handle filter changes
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Debounced filter
  useEffect(() => {
    const timer = setTimeout(() => {
      filterServices();
    }, 300);

    return () => clearTimeout(timer);
  }, [statusFilter, services]);

  useEffect(() => {
    fetchServices();
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
          <h1 className="text-3xl font-bold text-white">Quản lý Dịch vụ</h1>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tổng dịch vụ</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_services}</p>
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
                <p className="text-sm font-medium text-gray-400">Đang hoạt động</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_active}</p>
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
                <p className="text-sm font-medium text-gray-400">Không hoạt động</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-900">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Hết hàng</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_outofstock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-4">
            <select
              name="status"
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-800">Tất cả trạng thái</option>
              <option value="active" className="bg-gray-800">Đang hoạt động</option>
              <option value="inactive" className="bg-gray-800">Không hoạt động</option>
              <option value="outofstock" className="bg-gray-800">Hết hàng</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Thêm dịch vụ
          </button>
        </div>

        {/* Services Table */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hình ảnh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tạo lúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cập nhật lúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                      Không có dịch vụ nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {service.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {service.quantity || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            service.status === 'active'
                              ? 'bg-green-900 text-green-300'
                              : service.status === 'inactive'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {service.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {service.created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {service.updated_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(service)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
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

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Thêm dịch vụ mới</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Tên dịch vụ *"
                    value={newService.name}
                    onChange={handleNewServiceChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Giá *"
                    value={newService.price}
                    onChange={handleNewServiceChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Số lượng"
                    value={newService.quantity}
                    onChange={handleNewServiceChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="status"
                    value={newService.status}
                    onChange={handleNewServiceChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active" className="bg-gray-900">Đang hoạt động</option>
                    <option value="inactive" className="bg-gray-900">Không hoạt động</option>
                    <option value="outofstock" className="bg-gray-900">Hết hàng</option>
                  </select>
                  <textarea
                    name="description"
                    placeholder="Mô tả"
                    value={newService.description}
                    onChange={handleNewServiceChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  />
                  <input
                    type="file"
                    name="image"
                    onChange={handleNewImageChange}
                    accept="image/*"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  />
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
                    {loading ? 'Đang thêm...' : 'Thêm dịch vụ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Service Modal */}
      {isUpdateModalOpen && selectedService && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Cập nhật thông tin dịch vụ</h3>
              <form onSubmit={handleUpdateService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Tên dịch vụ *"
                    value={updateData.name}
                    onChange={handleUpdateChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Giá *"
                    value={updateData.price}
                    onChange={handleUpdateChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Số lượng"
                    value={updateData.quantity}
                    onChange={handleUpdateChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="status"
                    value={updateData.status}
                    onChange={handleUpdateChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active" className="bg-gray-900">Đang hoạt động</option>
                    <option value="inactive" className="bg-gray-900">Không hoạt động</option>
                    <option value="outofstock" className="bg-gray-900">Hết hàng</option>
                  </select>
                  <textarea
                    name="description"
                    placeholder="Mô tả"
                    value={updateData.description}
                    onChange={handleUpdateChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  />
                  <input
                    type="file"
                    name="image"
                    onChange={handleUpdateImageChange}
                    accept="image/*"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  />
                  {selectedService.image_url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Hình ảnh hiện tại</label>
                      <img
                        src={selectedService.image_url}
                        alt="Current"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdateModalOpen(false);
                      setSelectedService(null);
                      setUpdateData({ name: '', description: '', price: '', quantity: '', status: '' });
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

export default QuanLyDichVu;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, Plus, Edit2, Trash2, Image, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const QuanLyDichVu = ({ cinemaId }) => {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, outofstock: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form data
  const [newService, setNewService] = useState({
    name: "", description: "", price: "", quantity: "", status: "active"
  });
  const [editData, setEditData] = useState({ name: "", description: "", price: "", quantity: "", status: "" });
  const [newImage, setNewImage] = useState(null);
  const [editImage, setEditImage] = useState(null);

  // Fetch data
  useEffect(() => {
    if (!cinemaId) return;
    setLoading(true);
    axios.get(`/api/services/${cinemaId}`)
      .then(res => {
        if (res.data.success && Array.isArray(res.data.services)) {
          const data = res.data.services;
          setServices(data);
          setFiltered(data);
          setStats({
            total: data.length,
            active: data.filter(s => s.status === "active").length,
            inactive: data.filter(s => s.status === "inactive").length,
            outofstock: data.filter(s => s.status === "outofstock").length,
          });
        }
      })
      .catch(() => setError("Không thể tải dịch vụ"))
      .finally(() => setLoading(false));
  }, [cinemaId]);

  // Filter
  useEffect(() => {
    const filtered = statusFilter ? services.filter(s => s.status === statusFilter) : services;
    setFiltered(filtered);
  }, [statusFilter, services]);

  // Add service
  const handleAdd = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("cinema_id", cinemaId);
    Object.keys(newService).forEach(k => formData.append(k, newService[k]));
    if (newImage) formData.append("image", newImage);

    try {
      await axios.post("/api/services", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAddModal(false);
      setNewService({ name: "", description: "", price: "", quantity: "", status: "active" });
      setNewImage(null);
      window.location.reload();
    } catch { setError("Thêm thất bại"); }
  };

  // Edit service
  const openEdit = (s) => {
    setEditingService(s);
    setEditData({
      name: s.name,
      description: s.description || "",
      price: s.price,
      quantity: s.quantity || "",
      status: s.status
    });
    setEditImage(null);
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(editData).forEach(k => formData.append(k, editData[k]));
    if (editImage) formData.append("image", editImage);

    try {
      await axios.put(`/api/services/${editingService.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setEditModal(false);
      setEditingService(null);
      window.location.reload();
    } catch { setError("Cập nhật thất bại"); }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Xóa dịch vụ này?")) return;
    try {
      await axios.delete(`/api/services/${id}`);
      window.location.reload();
    } catch { setError("Xóa thất bại"); }
  };

  const statusBadge = (status) => {
    const cfg = {
      active: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/50" },
      inactive: { icon: XCircle, color: "text-red-400", bg: "bg-red-900/50" },
      outofstock: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-900/50" },
    }[status] || { icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-800/50" };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-4 h-4" />
        {status === "active" ? "Hoạt động" : status === "inactive" ? "Dừng" : "Hết hàng"}
      </span>
    );
  };

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl">
              <Package className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quản Lý Dịch Vụ
              </h1>
              <p className="text-gray-400">Thêm, sửa, xóa dịch vụ tại quầy</p>
            </div>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold transition-all shadow-lg"
          >
            <Plus className="w-6 h-6" />
            Thêm dịch vụ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Tổng dịch vụ", value: stats.total, color: "from-purple-600 to-pink-600" },
            { label: "Hoạt động", value: stats.active, color: "from-green-500 to-emerald-600" },
            { label: "Dừng bán", value: stats.inactive, color: "from-red-500 to-rose-600" },
            { label: "Hết hàng", value: stats.outofstock, color: "from-yellow-500 to-orange-600" },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <div className={`h-2 bg-gradient-to-r ${s.color} rounded-full mb-4`}></div>
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-6 flex justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Dừng bán</option>
            <option value="outofstock">Hết hàng</option>
          </select>
        </div>

        {/* Grid dịch vụ */}
        {error ? (
          <div className="text-center py-20 text-red-400 text-xl">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <Package className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <p className="text-2xl text-gray-400">Chưa có dịch vụ nào</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => (
              <div key={s.id} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all">
                {s.image_url && (
                  <img src={s.image_url} alt={s.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-purple-300">{s.name}</h3>
                    {statusBadge(s.status)}
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{s.description || "Không có mô tả"}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Giá:</span>
                      <span className="font-bold text-green-400">{Number(s.price).toLocaleString()}₫</span>
                    </div>
                    {s.quantity !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tồn kho:</span>
                        <span className={s.quantity == 0 ? "text-red-400" : "text-white"}>{s.quantity}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-purple-600 rounded-xl transition">
                      <Edit2 className="w-5 h-5" /> Sửa
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-red-600 rounded-xl transition">
                      <Trash2 className="w-5 h-5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {addModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">Thêm dịch vụ mới</h2>
              <form onSubmit={handleAdd} className="space-y-5">
                <input type="text" placeholder="Tên dịch vụ *" required value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                <textarea placeholder="Mô tả" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} rows="3" className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                <div className="grid md:grid-cols-3 gap-4">
                  <input type="number" placeholder="Giá *" required value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="number" placeholder="Số lượng" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <select value={newService.status} onChange={e => setNewService({...newService, status: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition">
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Dừng bán</option>
                    <option value="outofstock">Hết hàng</option>
                  </select>
                </div>
                <input type="file" accept="image/*" onChange={e => setNewImage(e.target.files[0])} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition" />
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setAddModal(false)} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition">Hủy</button>
                  <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition shadow-lg">Thêm dịch vụ</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal – ĐÃ SỬA HOÀN TOÀN */}
        {editModal && editingService && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">Cập nhật dịch vụ</h2>
              <form onSubmit={handleEdit} className="space-y-5">
                <input
                  type="text"
                  placeholder="Tên dịch vụ *"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition"
                />
                <textarea
                  placeholder="Mô tả"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows="3"
                  className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Giá *"
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    required
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition"
                  />
                  <input
                    type="number"
                    placeholder="Số lượng"
                    value={editData.quantity}
                    onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition"
                  />
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Dừng bán</option>
                    <option value="outofstock">Hết hàng</option>
                  </select>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImage(e.target.files[0])}
                  className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition"
                />
                {editingService.image_url && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Hình hiện tại:</p>
                    <img src={editingService.image_url} alt="Current" className="h-32 w-32 object-cover rounded-xl border border-gray-700" />
                  </div>
                )}
                <div className="flex justify-end gap-4 pt-6">
                  <button type="button" onClick={() => { setEditModal(false); setEditingService(null); }} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition">
                    Hủy
                  </button>
                  <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition shadow-lg">
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyDichVu;
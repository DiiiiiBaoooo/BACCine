import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Users, Phone, Mail, Ticket, XCircle, 
  CreditCard, Sparkles, AlertCircle 
} from "lucide-react";
import { initiateEventPayment, cancelEventRequest, getMyEventRequests } from "../lib/api";

const MyEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["myEvents", filterStatus],
    queryFn: () => getMyEventRequests({
      status: filterStatus === "all" ? undefined : filterStatus,
    }),
  });

  const requests = data?.data || [];

  const initiatePaymentMutation = useMutation({
    mutationFn: initiateEventPayment,
    onSuccess: (data, variables) => {
      const { eventId, quotedPrice } = variables;
      toast.success("Đang chuyển đến cổng thanh toán...");
      navigate(`/event-payment/${eventId}/${quotedPrice}`);
    },
    onError: (err) => toast.error(err.message || "Khởi tạo thanh toán thất bại"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelEventRequest,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu thành công");
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
    },
    onError: () => toast.error("Hủy thất bại"),
  });

  const handlePayment = (id, quoted_price) => {
    if (confirm("Xác nhận thanh toán suất chiếu riêng?")) {
      initiatePaymentMutation.mutate({ eventId: id, quotedPrice: Number(quoted_price) });
    }
  };

  const handleCancel = (id) => {
    if (confirm("Bạn chắc chắn muốn hủy yêu cầu này?")) {
      cancelMutation.mutate(id);
    }
  };

  const statusConfig = {
    pending: { label: "Chờ duyệt", color: "from-yellow-500 to-orange-500", icon: Clock },
    quoted: { label: "Đã báo giá", color: "from-blue-500 to-cyan-500", icon: Sparkles },
    payment_pending: { label: "Chờ thanh toán", color: "from-purple-500 to-pink-500", icon: AlertCircle },
    accepted: { label: "Đã xác nhận", color: "from-green-500 to-emerald-500", icon: Ticket },
    rejected: { label: "Bị từ chối", color: "from-red-500 to-rose-500", icon: XCircle },
    cancelled: { label: "Đã hủy", color: "from-gray-500 to-gray-600", icon: XCircle },
  };

  const formatDateForURL = (dateInput) => {
    if (!dateInput) return "";
    return new Date(dateInput).toISOString().split("T")[0];
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { y: 60, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    },
    hover: { 
      y: -12,
      scale: 1.02,
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-8 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
            Yêu Cầu Suất Chiếu Riêng
          </h1>
          <p className="text-2xl text-gray-300 mt-4">Quản lý và theo dõi mọi yêu cầu của bạn</p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {["all", "pending", "quoted", "payment_pending", "accepted", "rejected", "cancelled"].map((status) => {
            const count = status === "all" 
              ? requests.length 
              : requests.filter(r => r.status === status).length;
            if (count === 0 && status !== "all") return null;

            const isActive = filterStatus === status;
            const config = status === "all" ? { label: "Tất cả", color: "from-purple-600 to-pink-600" } : statusConfig[status];

            return (
              <motion.button
                key={status}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status)}
                className={`relative px-8 py-4 rounded-full font-bold text-lg transition-all overflow-hidden ${
                  isActive 
                    ? "text-white shadow-2xl ring-4 ring-purple-500/50" 
                    : "bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/70"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilter"
                    className={`absolute inset-0 bg-gradient-to-r ${config?.color || "from-purple-600 to-pink-600"}`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {config?.icon && <config.icon className="w-5 h-5" />}
                  {config?.label || "Tất cả"} ({count})
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Empty State */}
        <AnimatePresence mode="wait">
          {requests.length === 0 ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center py-24"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-9xl mb-8"
              >
              </motion.div>
              <h3 className="text-4xl font-bold text-gray-400 mb-6">Chưa có yêu cầu nào</h3>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/event"
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all"
                >
                  Tạo yêu cầu mới ngay!
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-10"
            >
              {requests.map((req, index) => {
                const status = statusConfig[req.status] || statusConfig.cancelled;
                return (
                  <motion.div
                    key={req.id}
                    variants={cardVariants}
                    whileHover="hover"
                    layout
                    className="relative bg-gray-900/90 backdrop-blur-2xl rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl"
                  >
                    {/* Gradient Top Bar */}
                    <div className={`bg-gradient-to-r ${status.color} p-8 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <h3 className="text-4xl font-bold drop-shadow-lg">{req.movie_title}</h3>
                          <p className="text-xl mt-3 opacity-90 flex items-center gap-4">
                            <Users className="w-6 h-6" /> {req.guest_count} khách • {req.cinema_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                            <status.icon className="w-6 h-6" />
                            <span className="text-xl font-bold">{status.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-5">
                          <div className="flex items-center gap-4 text-lg">
                            <Calendar className="w-6 h-6 text-purple-400" />
                            <span className="font-semibold">
                              {format(new Date(req.event_date), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-lg">
                            <Clock className="w-6 h-6 text-cyan-400" />
                            <span>{req.start_time} → {req.end_time || "Đang xác định"}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Phone className="w-5 h-5 text-green-400" />
                            <span>{req.contact_name} • {req.contact_phone}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Mail className="w-5 h-5 text-pink-400" />
                            <span>{req.contact_email}</span>
                          </div>
                        </div>

                        <div>
                          {req.quoted_price && (
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-6 text-center"
                            >
                              <p className="text-sm text-green-300 mb-2">Báo giá từ rạp</p>
                              <p className="text-5xl font-bold text-green-400">
                                {Number(req.quoted_price).toLocaleString("vi-VN")} ₫
                              </p>
                              {req.quote_note && (
                                <p className="text-sm text-gray-300 mt-4 italic">"{req.quote_note}"</p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-4 justify-end">
                        {req.status === "quoted" && (
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handlePayment(req.id, req.quoted_price)}
                            disabled={initiatePaymentMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-green-500/60 disabled:opacity-70 flex items-center gap-3"
                          >
                            <CreditCard className="w-7 h-7" />
                            {initiatePaymentMutation.isPending ? "Đang xử lý..." : "Thanh toán ngay"}
                          </motion.button>
                        )}

                        {req.status === "payment_pending" && (
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => navigate(`/event-payment/${req.id}/${req.quoted_price}`)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-purple-500/60 flex items-center gap-3"
                          >
                            Tiếp tục thanh toán
                          </motion.button>
                        )}

                        {["pending", "quoted", "payment_pending"].includes(req.status) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="bg-gray-700 hover:bg-red-600 px-8 py-5 rounded-full font-bold text-lg transition-all flex items-center gap-2"
                          >
                            <XCircle className="w-6 h-6" />
                            Hủy yêu cầu
                          </motion.button>
                        )}

                        {req.status === "accepted" && req.showtime_id && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                              to={`/movies/${req.movie_id}/${req.cinema_id}/${formatDateForURL(req.event_date)}`}
                              target="_blank"
                              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-purple-500/60 flex items-center gap-3"
                            >
                              <Ticket className="w-7 h-7" />
                              Xem vé suất chiếu riêng
                            </Link>
                          </motion.div>
                        )}
                      </div>

                      <div className="mt-8 text-right text-gray-400 text-sm">
                        Gửi lúc: {format(new Date(req.created_at), "HH:mm - dd/MM/yyyy", { locale: vi })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyEvent;
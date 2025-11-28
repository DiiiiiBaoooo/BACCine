import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Users, Clock, Film, MapPin, Star, ChevronRight } from "lucide-react"
import EventRequestForm from "../components/EventRequestForm"

const Event = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-900 via-black to-red-950 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Thuê Rạp Phim Riêng
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
          >
            Tạo nên khoảnh khắc đáng nhớ cùng bạn bè, gia đình hoặc đồng nghiệp tại rạp phim BAC Cinema
          </motion.p>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
          >
            <Calendar className="w-6 h-6" />
            Đăng Ký Ngay
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-black-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Tại sao chọn BAC Event?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: <Film className="w-12 h-12 text-red-600" />,
                title: "Toàn bộ rạp phim riêng",
                desc: "Bạn và khách mời sẽ là những khán giả duy nhất trong suất chiếu",
              },
              {
                icon: <Users className="w-12 h-12 text-red-600" />,
                title: "Từ 10 - 300 khách",
                desc: "Phù hợp sinh nhật, kỷ niệm, team building, hội nghị...",
              },
              {
                icon: <Clock className="w-12 h-12 text-red-600" />,
                title: "Linh hoạt thời gian",
                desc: "Chọn ngày & giờ chiếu theo mong muốn (trong khung giờ cho phép)",
              },
              {
                icon: <Star className="w-12 h-12 text-red-600" />,
                title: "Dịch vụ VIP",
                desc: "Âm thanh Dolby, màn hình lớn, ghế đôi, combo ăn uống riêng",
              },
              {
                icon: <Calendar className="w-12 h-12 text-red-600" />,
                title: "Phim hot nhất",
                desc: "Chọn phim đang chiếu hoặc phim theo yêu cầu đặc biệt",
              },
              {
                icon: <MapPin className="w-12 h-12 text-red-600" />,
                title: "Nhiều địa điểm",
                desc: "Hệ thống rạp BAC tại TP.HCM & các tỉnh thành lớn",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-shadow"
              >
                <div className="mb-5 flex justify-center">{item.icon}</div>
                <h3 className="text-2xl text-red-500 font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Quy trình đặt rạp riêng</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Gửi yêu cầu", desc: "Điền thông tin phim, ngày giờ, số khách" },
              { step: "2", title: "Nhận báo giá", desc: "Quản lý rạp liên hệ & gửi bảng giá trong 24h" },
              { step: "3", title: "Thanh toán & xác nhận", desc: "Chấp nhận báo giá → nhận vé điện tử" },
              { step: "4", title: "Thưởng thức phim riêng", desc: "Check-in và tận hưởng không gian riêng tư!" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-5">
                  {item.step}
                </div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 bg-red-600 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Sẵn sàng tạo nên kỷ niệm khó quên?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">Đặt rạp riêng ngay hôm nay – chỉ từ vài triệu đồng!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-red-600 hover:bg-gray-100 font-bold text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-4"
          >
            <Calendar className="w-8 h-8" />
            Đặt Lịch Ngay
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 bg-black bg-opacity-80 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-transparent w-full max-w-2xl"
          >
            {/* Nút đóng */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-2xl z-10 backdrop-blur-sm"
            >
              ×
            </button>

            {/* Form */}
            <EventRequestForm />
          </motion.div>
        </div>
      )}
    </>
  )
}

export default Event

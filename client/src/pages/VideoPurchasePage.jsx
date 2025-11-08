import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, Check, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios"
const VideoPurchasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseType, setPurchaseType] = useState('buy'); // 'buy' or 'rent'

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const fetchVideoDetails = async () => {
    try {
      const response = await axios.get(
        `api/video-purchase/${id}`,
        { withCredentials: true }
      );
      setVideo(response.data.video);
    } catch (error) {
      console.error('Error fetching video:', error);
      alert('Không thể tải thông tin video');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const response = await axios.post(
        'api/video-purchase/purchase',
        {
          video_id: id,
          purchase_type: purchaseType,
          payment_method: 'credit_card',
          transaction_id: `TXN${Date.now()}`,
        },
        { withCredentials: true }
      );

      alert(response.data.message);
      navigate(`/xem-phim/${id}`);
    } catch (error) {
      console.error('Purchase error:', error);
      alert(error.response?.data?.message || 'Lỗi khi mua video');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Video không tồn tại</div>
      </div>
    );
  }

  // Nếu đã có quyền xem
  if (video.has_access) {
    navigate(`/xem-phim/${id}`);
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/video')}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại thư viện
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-[2/3]">
            <img
              src={video.poster_image_url || 'https://via.placeholder.com/400x600'}
              alt={video.video_title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent">
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-semibold">Yêu cầu thanh toán</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Options */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-300 to-purple-300 bg-clip-text text-transparent">
              {video.video_title}
            </h1>
            
            <p className="text-slate-400 mb-8">
              Chọn cách thuê hoặc mua để xem video này
            </p>

            {/* Purchase Options */}
            <div className="space-y-4 mb-8">
              {/* Rent Option */}
              {video.rental_duration && (
                <div
                  onClick={() => setPurchaseType('rent')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    purchaseType === 'rent'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h3 className="font-semibold text-lg">Thuê video</h3>
                        <p className="text-sm text-slate-400">
                          Xem trong {video.rental_duration} ngày
                        </p>
                      </div>
                    </div>
                    {purchaseType === 'rent' && (
                      <Check className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatPrice(video.price * 0.3)} {/* Giá thuê = 30% giá mua */}
                  </div>
                </div>
              )}

              {/* Buy Option */}
              <div
                onClick={() => setPurchaseType('buy')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  purchaseType === 'buy'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-lg">Mua vĩnh viễn</h3>
                      <p className="text-sm text-slate-400">
                        Xem không giới hạn
                      </p>
                    </div>
                  </div>
                  {purchaseType === 'buy' && (
                    <Check className="w-6 h-6 text-purple-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {formatPrice(video.price)}
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/50"
            >
              {purchasing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <span>
                  {purchaseType === 'buy' ? 'Mua ngay' : 'Thuê ngay'} -{' '}
                  {formatPrice(purchaseType === 'buy' ? video.price : video.price * 0.3)}
                </span>
              )}
            </button>

            {/* Features */}
            <div className="mt-8 space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Chất lượng HD</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Không quảng cáo</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Hỗ trợ nhiều thiết bị</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPurchasePage;
import React, { useEffect, useMemo, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthUser from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import FortuneWheel from '../components/FortuneWheel';
import { Gift, Star, Trophy, Copy, Clock, Sparkles } from 'lucide-react';

const Membership = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();

  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoadingTiers(true);
        const res = await axios.get('/api/membershiptiers/');
        if (res.data?.success) setTiers(res.data.membershiptiers || []);
      } catch (error) {
        toast.error('Lỗi khi tải hạng thẻ');
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
  }, []);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!authUser?.id) {
        setMembership(null);
        return;
      }
      try {
        setLoadingMembership(true);
        const res = await axios.get(`/api/membershiptiers/${authUser.id}`);
        if (res.data?.success && res.data.membership?.length > 0) {
          setMembership(res.data.membership[0]);
        } else {
          setMembership(null);
        }
      } catch (error) {
        console.error('Error fetching membership:', error);
      } finally {
        setLoadingMembership(false);
      }
    };
    fetchMembership();
  }, [authUser?.id]);

  const fetchHistory = async () => {
    if (!authUser?.id) return;
    try {
      setLoadingHistory(true);
      const res = await axios.get(`/api/membershiptiers/history/${authUser.id}`);
      if (res.data?.success) setHistory(res.data.history || []);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [authUser?.id]);

  const handleSpinSuccess = async (data) => {
    if (membership) {
      setMembership({ ...membership, current_points: data.newPoints });
    }
    toast.success('Quay thành công!');
    await fetchHistory();
  };

  const handleRegister = async () => {
    if (!authUser?.id) {
      toast.info('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    try {
      setRegistering(true);
      const res = await axios.post(`/api/membershiptiers/register/${authUser.id}`);
      if (res.data?.success) {
        toast.success('Đăng ký thành công!');
        const check = await axios.get(`/api/membershiptiers/${authUser.id}`);
        if (check.data?.success && check.data.membership?.length > 0) {
          setMembership(check.data.membership[0]);
        }
      } else {
        toast.error(res.data?.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setRegistering(false);
    }
  };

  const sliderSettings = useMemo(() => ({
    dots: true,
    arrows: false,
    infinite: tiers.length > 3,
    speed: 500,
    slidesToShow: Math.min(tiers.length, 3),
    slidesToScroll: 1,
    autoplay: tiers.length > 3,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  }), [tiers.length]);

  const copyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy: ${code}`);
  };

  return (
    <div className="min-h-screen bg-black text-white py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            Membership
          </h1>
          <p className="text-gray-400 text-sm">Tích điểm, nâng hạng và nhận quà</p>
        </div>

        {/* Membership Card - Compact */}
        {loadingMembership ? (
          <div className="bg-gradient-to-r from-gray-900 to-black border border-red-500/30 rounded-xl p-4 mb-6 animate-pulse">
            <div className="h-16 bg-gray-800 rounded"></div>
          </div>
        ) : membership ? (
          <div className="bg-gradient-to-r from-gray-900 to-black border border-red-500/30 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Hạng thẻ</p>
                  <p className="text-lg font-bold text-white">{membership.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Điểm tích lũy</p>
                <p className="text-xl font-bold text-yellow-400">
                  {Number(membership.current_points || membership.points || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center bg-gradient-to-r from-gray-900 to-black border border-red-500/30 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-400 mb-3">Bạn chưa có thẻ thành viên</p>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-semibold text-sm hover:shadow-lg disabled:opacity-60 transition-all"
            >
              {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
            </button>
          </div>
        )}

        {/* Benefits - Compact */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 rounded-lg p-3 border border-red-500/30 text-center">
            <Star className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-white">Tích điểm</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-orange-500/30 text-center">
            <Gift className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-white">Ưu đãi giá</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-yellow-500/30 text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-white">VIP</p>
          </div>
        </div>

        {/* Tiers - Compact */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Các hạng thẻ</h2>
          {loadingTiers ? (
            <p className="text-gray-400 text-sm text-center">Đang tải...</p>
          ) : tiers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center">Chưa có hạng thẻ</p>
          ) : (
            <Slider {...sliderSettings}>
              {tiers.map((tier) => (
                <div key={tier.id} className="px-2">
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-48">
                    <h3 className="text-lg font-bold text-red-400 mb-2">{tier.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Tối thiểu: <span className="text-yellow-400 font-semibold">
                        {Number(tier.min_points || 0).toLocaleString()} điểm
                      </span>
                    </p>
                    {tier.benefits && (
                      <div className="text-xs text-gray-300 space-y-1 mb-3">
                        {String(tier.benefits).split('\n').slice(0, 3).map((b, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="text-red-400 text-xs">•</span>
                            <span className="line-clamp-1">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>

        {/* Fortune Wheel + History - Side by side */}
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Vòng Quay May Mắn
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Wheel */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-4">
                Chi phí: <span className="text-yellow-400 font-bold">5,000 điểm</span> / lượt
              </p>
              <div className="w-full max-w-sm">
                <FortuneWheel
                  userId={authUser?.id}
                  currentPoints={membership?.current_points || membership?.points || 0}
                  onSpinSuccess={handleSpinSuccess}
                />
              </div>
            </div>

            {/* Right: History */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Lịch sử quay thưởng
              </h3>
              <div className="bg-black/50 border border-gray-800 rounded-xl p-4 h-80 overflow-y-auto">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-gray-400 text-sm">Đang tải...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Chưa có lượt quay</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-red-500/50 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{item.reward}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(item.created_at).toLocaleString('vi-VN')}
                            </p>
                            {item.expires_at && (
                              <p className="text-xs text-yellow-400 mt-1">
                                HSD: {new Date(item.expires_at).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                          {item.voucher_code ? (
                            <div className="flex items-center gap-1">
                              <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                                {item.voucher_code}
                              </span>
                              <button
                                onClick={() => copyVoucher(item.voucher_code)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 p-1.5 rounded"
                                title="Copy mã"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-green-400 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Membership;
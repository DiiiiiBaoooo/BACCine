import React, { useEffect, useMemo, useState } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthUser from '../hooks/useAuthUser'
import { useNavigate } from 'react-router-dom'
import FortuneWheel from '../components/FortuneWheel'

const Membership = () => {
  const { authUser } = useAuthUser()
  const navigate = useNavigate()

  const [tiers, setTiers] = useState([])
  const [loadingTiers, setLoadingTiers] = useState(false)
  const [membership, setMembership] = useState(null)
  const [loadingMembership, setLoadingMembership] = useState(false)
  const [registering, setRegistering] = useState(false)

  // Lịch sử quay thưởng
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch tiers
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoadingTiers(true)
        const res = await axios.get('/api/membershiptiers/')
        if (res.data?.success) setTiers(res.data.membershiptiers || [])
      } catch (error) {
        toast.error('Lỗi khi tải hạng thẻ')
      } finally {
        setLoadingTiers(false)
      }
    }
    fetchTiers()
  }, [])

  // Fetch membership
  useEffect(() => {
    const fetchMembership = async () => {
      if (!authUser?.id) {
        setMembership(null)
        return
      }
      try {
        setLoadingMembership(true)
        const res = await axios.get(`/api/membershiptiers/${authUser.id}`)
        if (res.data?.success && res.data.membership?.length > 0) {
          setMembership(res.data.membership[0])
        } else {
          setMembership(null)
        }
      } catch (error) {
        console.error('Error fetching membership:', error)
      } finally {
        setLoadingMembership(false)
      }
    }
    fetchMembership()
  }, [authUser?.id])

  // Fetch lịch sử
  const fetchHistory = async () => {
    if (!authUser?.id) return
    try {
      setLoadingHistory(true)
      const res = await axios.get(`/api/membershiptiers/history/${authUser.id}`)
      if (res.data?.success) setHistory(res.data.history || [])
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [authUser?.id])

  const handleSpinSuccess = async (data) => {
    if (membership) {
      setMembership({ ...membership, current_points: data.newPoints })
    }
    toast.success('Quay thành công!')
    await fetchHistory()
  }

  const handleRegister = async () => {
    if (!authUser?.id) {
      toast.info('Vui lòng đăng nhập')
      navigate('/login')
      return
    }
    try {
      setRegistering(true)
      const res = await axios.post(`/api/membershiptiers/register/${authUser.id}`)
      if (res.data?.success) {
        toast.success('Đăng ký thành công!')
        const check = await axios.get(`/api/membershiptiers/${authUser.id}`)
        if (check.data?.success && check.data.membership?.length > 0) {
          setMembership(check.data.membership[0])
        }
      } else {
        toast.error(res.data?.message || 'Đăng ký thất bại')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi hệ thống')
    } finally {
      setRegistering(false)
    }
  }

  const sliderSettings = useMemo(() => ({
    dots: true,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: tiers.length > 3,
    autoplaySpeed: 4000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  }), [tiers.length])

  const copyVoucher = (code) => {
    navigator.clipboard.writeText(code)
    toast.success(`Đã copy: ${code}`)
  }

  return (
    <div className="min-h-screen   bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden">
      <div className="container mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Chương Trình Membership
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Tích điểm, nâng hạng và quay vòng may mắn nhận quà!
          </p>
        </div>

        {/* Membership Card */}
        {loadingMembership ? (
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 mb-16 backdrop-blur animate-pulse">
            <div className="h-20 bg-gray-700/50 rounded"></div>
          </div>
        ) : membership ? (
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 mb-16 backdrop-blur shadow-2xl hover:shadow-indigo-500/20 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-400 text-sm mb-2">Hạng Thẻ</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {membership.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-2">Điểm Tích Lũy</p>
                <p className="text-4xl font-bold text-yellow-400">
                  {Number(membership.current_points || membership.points || 0).toLocaleString()} pts
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 mb-16 backdrop-blur">
            <p className="text-xl text-gray-300 mb-6">Bạn chưa có thẻ thành viên</p>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-bold hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-60 transition-all"
            >
              {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
            </button>
          </div>
        )}

        {/* Membership Benefits */}
        <div className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-8 mb-16 backdrop-blur">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Quyền Lợi Thành Viên</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/60 transition-all">
              <p className="text-xl font-bold mb-2 text-indigo-300">Tích Điểm Thưởng</p>
              <p className="text-gray-400 text-sm">Nhận điểm từ mỗi đơn hàng</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/60 transition-all">
              <p className="text-xl font-bold mb-2 text-purple-300">Ưu Đãi Giá</p>
              <p className="text-gray-400 text-sm">Giảm giá vé & combo</p>
            </div>
            <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-xl p-6 border border-pink-500/30 hover:border-pink-400/60 transition-all">
              <p className="text-xl font-bold mb-2 text-pink-300">Ưu Tiên VIP</p>
              <p className="text-gray-400 text-sm">Sự kiện & suất chiếu riêng</p>
            </div>
          </div>
        </div>

        {/* Tiers Carousel */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Các Hạng Thẻ</h2>
          {loadingTiers ? (
            <p className="text-gray-400 text-center">Đang tải...</p>
          ) : tiers.length === 0 ? (
            <p className="text-gray-400 text-center">Chưa có hạng thẻ</p>
          ) : (
            <Slider {...sliderSettings}>
              {tiers.map((tier) => (
                <div key={tier.id} className="px-2">
                  <div className="h-full bg-slate-900/50 border border-indigo-500/20 rounded-xl p-6 flex flex-col backdrop-blur hover:border-indigo-500/50 transition-all shadow-lg">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                      {tier.name}
                    </h3>
                    <div className="text-sm text-gray-400 mb-4">
                      Điểm tối thiểu: <span className="font-semibold text-indigo-400">
                        {Number(tier.min_points || 0).toLocaleString()}
                      </span>
                    </div>
                    {tier.benefits && (
                      <ul className="text-sm text-gray-300 space-y-2 mb-6 flex-1">
                        {String(tier.benefits).split('\n').map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">Arrow</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!membership && (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 transition-all"
                      >
                        {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>

        {/* VÒNG QUAY + LỊCH SỬ - DƯỚI CÙNG, 2 CỘT */}
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Vòng Quay May Mắn & Lịch Sử
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* CỘT TRÁI: VÒNG QUAY */}
            <div className="flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-indigo-300">Quay Ngay!</h3>
              <p className="text-gray-400 mb-8 text-center">Chi phí: <span className="text-yellow-400 font-bold">5.000 điểm</span> / lượt</p>
              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl w-full max-w-md">
                <FortuneWheel
                  userId={authUser?.id}
                  currentPoints={membership?.current_points || membership?.points || 0}
                  onSpinSuccess={handleSpinSuccess}
                />
              </div>
            </div>

            {/* CỘT PHẢI: LỊCH SỬ */}
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold mb-6 text-yellow-300">Lịch Sử Quay Thưởng</h3>
              <div className="bg-slate-800/60 border border-indigo-500/20 rounded-2xl p-6 h-full max-h-96 overflow-y-auto backdrop-blur">
                {loadingHistory ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="w-10 h-10 border-4 border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Đang tải...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-500">Chưa có lượt quay</p>
                    <p className="text-gray-400 mt-2">Hãy quay để nhận quà!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4 hover:border-indigo-400/60 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-white">{item.reward}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.created_at).toLocaleString('vi-VN')}
                            </p>
                            {item.expires_at && (
                              <p className="text-xs text-yellow-400 mt-1">
                                HSD: {new Date(item.expires_at).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                          {item.voucher_code ? (
                            <div className="flex items-center gap-2 ml-4">
                              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                                {item.voucher_code}
                              </span>
                              <button
                                onClick={() => copyVoucher(item.voucher_code)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 p-2 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-green-400 text-sm font-medium">Đã nhận</span>
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
  )
}

export default Membership
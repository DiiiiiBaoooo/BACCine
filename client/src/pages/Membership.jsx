import React, { useEffect, useMemo, useState } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthUser from '../hooks/useAuthUser'
import { useNavigate } from 'react-router-dom'

const Membership = () => {
  const { authUser } = useAuthUser()
  const navigate = useNavigate()

  const [tiers, setTiers] = useState([])
  const [loadingTiers, setLoadingTiers] = useState(false)
  const [membership, setMembership] = useState(null)
  const [loadingMembership, setLoadingMembership] = useState(false)
  const [registering, setRegistering] = useState(false)

  // Fetch tiers
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoadingTiers(true)
        const res = await axios.get('/api/membershiptiers/')
        if (res.data?.success) {
          setTiers(res.data.membershiptiers || [])
        } else {
          setTiers([])
        }
      } catch (error) {
        console.error('Error fetching tiers:', error)
        toast.error('Lỗi khi tải hạng thẻ')
      } finally {
        setLoadingTiers(false)
      }
    }
    fetchTiers()
  }, [])

  // Fetch current membership
  useEffect(() => {
    const fetchMembership = async () => {
      if (!authUser?.id) {
        setMembership(null)
        return
      }
      try {
        setLoadingMembership(true)
        const res = await axios.get(`/api/membershiptiers/${authUser.id}`)
        if (res.data?.success && Array.isArray(res.data.membership) && res.data.membership.length > 0) {
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

  const handleRegister = async () => {
    if (!authUser?.id) {
      toast.info('Vui lòng đăng nhập để đăng ký thẻ')
      navigate('/login')
      return
    }
    try {
      setRegistering(true)
      const res = await axios.post(`/api/membershiptiers/register/${authUser.id}`)
      if (res.data?.success) {
        toast.success('Đăng ký thẻ thành công')
        // refetch membership
        const check = await axios.get(`/api/membershiptiers/${authUser.id}`)
        if (check.data?.success && Array.isArray(check.data.membership) && check.data.membership.length > 0) {
          setMembership(check.data.membership[0])
        }
      } else {
        toast.error(res.data?.message || 'Đăng ký thẻ thất bại')
      }
    } catch (error) {
      console.error('Register membership error:', error)
      toast.error(error.response?.data?.message || 'Không thể đăng ký thẻ hiện tại')
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
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  }), [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">Chính sách Membership</h1>

        {/* Policy section */}
        <div className="bg-gray-900 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-semibold text-primary mb-3">Quyền lợi thành viên</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Tích điểm trên mỗi đơn hàng để thăng hạng</li>
            <li>Ưu đãi giá vé và combo theo hạng thẻ</li>
            <li>Ưu tiên tham gia sự kiện và suất chiếu đặc biệt</li>
          </ul>
        </div>

        {/* Current membership status */}
        <div className="bg-gray-900 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-semibold text-primary mb-3">Thẻ của bạn</h2>
          {loadingMembership ? (
            <p className="text-gray-400">Đang kiểm tra thẻ thành viên...</p>
          ) : membership ? (
            <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div>
                <div className="text-sm text-gray-400">Hạng thẻ</div>
                <div className="text-white font-semibold text-lg">{membership.tier_name || membership.tier || membership.name || 'Thành viên'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Điểm</div>
                <div className="text-white font-semibold text-lg">{Number(membership.points || membership.current_points || 0).toLocaleString()} pts</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-300">Bạn chưa có thẻ thành viên</p>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Đang đăng ký...' : 'Đăng ký thẻ thành viên'}
              </button>
            </div>
          )}
        </div>

        {/* Tiers carousel */}
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Các hạng thẻ</h2>
          </div>

          {loadingTiers ? (
            <p className="text-gray-400">Đang tải hạng thẻ...</p>
          ) : tiers.length === 0 ? (
            <p className="text-gray-400">Chưa có hạng thẻ nào</p>
          ) : (
            <Slider {...sliderSettings}>
              {tiers.map((tier) => (
                <div key={tier.id} className="px-2">
                  <div className="h-full bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-2">{tier.name}</h3>
                    <div className="text-sm text-gray-400 mb-3">Điểm tối thiểu: {Number(tier.min_points || 0).toLocaleString()}</div>
                    {tier.benefits && (
                      <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                        {String(tier.benefits).split('\n').map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto pt-4">
                      {!membership && (
                        <button
                          onClick={handleRegister}
                          disabled={registering}
                          className="w-full px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>
    </div>
  )
}

export default Membership
import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const FortuneWheel = ({ userId, currentPoints, onSpinSuccess }) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [selectedReward, setSelectedReward] = useState(null)
  const [voucherInfo, setVoucherInfo] = useState(null) // Lưu thông tin voucher từ API

  const SPIN_COST = 5000

  const segments = [
    { id: 1, label: '10%', color: '#FF6B6B', reward: 'Giảm 10%', type: 'voucher' },
    { id: 2, label: '50K', color: '#4ECDC4', reward: 'Voucher 50K', type: 'voucher' },
    { id: 3, label: 'Free', color: '#FFE66D', reward: 'Vé miễn phí', type: 'voucher' },
    { id: 4, label: '20%', color: '#95E1D3', reward: 'Giảm 20%', type: 'voucher' },
    { id: 5, label: '100K', color: '#F38181', reward: 'Voucher 100K', type: 'voucher' },
    { id: 6, label: '15K', color: '#AA96DA', reward: 'Voucher giảm 15K', type: 'voucher' },
    { id: 7, label: '25K', color: '#FCBAD3', reward: 'Voucher 25K', type: 'voucher' },
    { id: 8, label: '30%', color: '#A8DADC', reward: 'Giảm 30%', type: 'voucher' },
  ]

  const handleSpin = async () => {
    if (isSpinning) return
    if (!userId) {
      toast.error('Vui lòng đăng nhập để quay!')
      return
    }
    if (currentPoints < SPIN_COST) {
      toast.error(`Bạn cần ít nhất ${SPIN_COST.toLocaleString()} điểm để quay!`)
      return
    }

    setIsSpinning(true)
    setSelectedReward(null)
    setVoucherInfo(null)

    // Animation
    const spins = 4 + Math.random() * 2
    const stopPosition = Math.random() * 360
    const totalRotation = spins * 360 + stopPosition
    setRotation(totalRotation)

    setTimeout(async () => {
      const normalizedRotation = totalRotation % 360
      const segmentAngle = 360 / segments.length
      const selectedIndex = Math.floor((360 - normalizedRotation) / segmentAngle) % segments.length
      const selected = segments[selectedIndex]

      try {
        const res = await axios.post(`/api/membershiptiers/spin/${userId}`, {
          reward: selected.reward,
          type: selected.type,
        })

        if (res.data?.success) {
          setSelectedReward(selected.reward)
          setVoucherInfo({
            code: res.data.voucherCode,
            discountType: res.data.discountType,
            discountValue: res.data.discountValue,
            expiresAt: res.data.expiresAt,
          })

          toast.success(
            selected.type === 'voucher'
              ? `Chúc mừng! Mã giảm giá: ${res.data.voucherCode}`
              : `Chúc mừng! Bạn nhận được: ${selected.reward}`
          )

          // Gọi callback để cập nhật điểm & lịch sử ở component cha
          onSpinSuccess?.({
            newPoints: res.data.newPoints,
            voucherCode: res.data.voucherCode,
            historyId: res.data.giftId, // hoặc historyId nếu bạn dùng tên khác
          })
        } else {
          toast.error(res.data?.message || 'Lỗi khi xử lý phần thưởng')
        }
      } catch (error) {
        console.error('Spin error:', error)
        toast.error(error.response?.data?.message || 'Không thể quay, vui lòng thử lại!')
      } finally {
        setIsSpinning(false)
      }
    }, 3200)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Cost Info */}
      <div className="text-center">
        <p className="text-yellow-400 font-semibold">Chi phí: {SPIN_COST.toLocaleString()} điểm/lượt</p>
        <p className="text-sm text-gray-400">Bạn có: {currentPoints?.toLocaleString() || 0} điểm</p>
      </div>

      {/* Wheel Container */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"></div>

        {/* Wheel */}
        <svg
          className="w-full h-full transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '3.2s' : '0s',
            transitionTimingFunction: isSpinning ? 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
          viewBox="0 0 200 200"
        >
          {segments.map((segment, index) => {
            const angle = (360 / segments.length) * index
            const radians = (angle * Math.PI) / 180
            const nextRadians = ((angle + 360 / segments.length) * Math.PI) / 180
            const x1 = 100 + 100 * Math.cos(radians)
            const y1 = 100 + 100 * Math.sin(radians)
            const x2 = 100 + 100 * Math.cos(nextRadians)
            const y2 = 100 + 100 * Math.sin(nextRadians)
            const path = `M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`

            return (
              <g key={segment.id}>
                <path d={path} fill={segment.color} stroke="#1a1a1a" strokeWidth="3" />
                <text
                  x={100 + 68 * Math.cos((angle + 360 / segments.length / 2) * (Math.PI / 180))}
                  y={100 + 68 * Math.sin((angle + 360 / segments.length / 2) * (Math.PI / 180))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="15"
                  fontWeight="bold"
                  style={{
                    transform: `rotate(${angle + 360 / segments.length / 2 + 90}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  {segment.label}
                </text>
              </g>
            )
          })}
          {/* Center */}
          <circle cx="100" cy="100" r="25" fill="#1a1a1a" stroke="#fff" strokeWidth="3" />
          <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            SPIN
          </text>
        </svg>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || !userId || currentPoints < SPIN_COST}
        className={`px-10 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 ${
          isSpinning || !userId || currentPoints < SPIN_COST
            ? 'bg-gray-600 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-xl hover:shadow-2xl hover:shadow-orange-500/50'
        }`}
      >
        {isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
      </button>

      {/* Result */}
      {selectedReward && (
        <div className="text-center animate-bounce max-w-xs">
          <p className="text-sm text-gray-300 mb-1">Phần thưởng:</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            {selectedReward}
          </p>

          {voucherInfo?.code && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-yellow-500">
              <p className="text-xs text-gray-400">Mã giảm giá:</p>
              <p className="text-lg font-mono font-bold text-yellow-400 tracking-wider">
                {voucherInfo.code}
              </p>

              {voucherInfo.discountType && (
                <p className="text-xs text-gray-300 mt-1">
                  Giảm:{' '}
                  {voucherInfo.discountType === 'percent'
                    ? `${voucherInfo.discountValue}%`
                    : `${(voucherInfo.discountValue / 1000).toFixed(0)}K`}
                  {voucherInfo.expiresAt && (
                    <> · HSD: {new Date(voucherInfo.expiresAt).toLocaleDateString('vi-VN')}</>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FortuneWheel
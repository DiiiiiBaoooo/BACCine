// src/pages/PaymentFail.jsx
"use client";

import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason") || "Không xác định";

  // Nếu không có orderId → vẫn cho xem trang, chỉ hiện lý do
  useEffect(() => {
    // Có thể bỏ qua, vì trang này chỉ là thông báo
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl p-8 text-center">
        {/* Icon thất bại */}
        <div className="mx-auto mb-6 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Thanh toán thất bại
        </h1>

        <p className="text-gray-300 mb-8">
          <span className="font-semibold text-red-400">Lý do:</span> {reason}
        </p>

        {/* Nút duy nhất */}
        <button
          onClick={() => navigate("/tickets")}
          className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 transition duration-200"
        >
          Quay lại vé của tôi
        </button>

        <p className="text-xs text-gray-500 mt-6">
          Cần hỗ trợ? Liên hệ{" "}
          <a href="mailto:support@cinema.vn" className="underline">
            support@cinema.vn
          </a>
        </p>
      </div>
    </div>
  );
}
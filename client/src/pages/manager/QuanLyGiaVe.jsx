import React, { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const QuanLyGiaVe = ({ cinemaId }) => {
  const [prices, setPrices] = useState([
    { seat_type: "Standard", base_price: "", weekend_price: "", special_price: "" },
    { seat_type: "VIP", base_price: "", weekend_price: "", special_price: "" },
    { seat_type: "Couple", base_price: "", weekend_price: "", special_price: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cinemaId) return;
    setLoading(true);
    axios
      .get(`/api/ticketprice/${cinemaId}`)
      .then((res) => {
        const fetchedPrices = res.data.ticket_price || [];
        // Map fetched prices to the fixed seat types
        const updatedPrices = [
          { seat_type: "Standard", base_price: "", weekend_price: "", special_price: "" },
          { seat_type: "VIP", base_price: "", weekend_price: "", special_price: "" },
          { seat_type: "Couple", base_price: "", weekend_price: "", special_price: "" },
        ];
        fetchedPrices.forEach((p) => {
          const index = updatedPrices.findIndex((up) => up.seat_type === p.seat_type);
          if (index !== -1) {
            updatedPrices[index] = {
              seat_type: p.seat_type,
              base_price: p.base_price || "",
              weekend_price: p.weekend_price || "",
              special_price: p.special_price || "",
            };
          }
        });
        setPrices(updatedPrices);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [cinemaId]);

  const handleChange = (seatType, field, value) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.seat_type === seatType ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = () => {
    setSaving(true);
    // Validate prices before saving
    const validPrices = prices.filter(
      (p) =>
        p.base_price !== "" &&
        p.weekend_price !== "" &&
        p.special_price !== "" &&
        parseFloat(p.base_price) >= 0 &&
        parseFloat(p.weekend_price) >= 0 &&
        parseFloat(p.special_price) >= 0
    );
    if (validPrices.length !== prices.length) {
      alert("Vui lòng nhập đầy đủ và hợp lệ tất cả giá vé!");
      setSaving(false);
      return;
    }

    axios
      .put(`/api/ticketprice/updateprice/${cinemaId}`, {
        cinema_id: cinemaId,
        prices: validPrices,
      })
      .then(() => alert("Lưu giá vé thành công!"))
      .catch(() => alert("Có lỗi xảy ra!"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Quản lý giá vé</h1>
      {loading ? (
        <p className="text-gray-300">Đang tải dữ liệu...</p>
      ) : (
        <div className="space-y-6">
          <table className="w-full text-sm text-left border border-gray-700">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="p-2">Loại ghế</th>
                <th className="p-2">Giá cơ bản</th>
                <th className="p-2">Giá cuối tuần</th>
                <th className="p-2">Giá đặc biệt</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.seat_type} className="border-b border-gray-700">
                  <td className="p-2 text-red-500 font-semibold">{p.seat_type}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.base_price}
                      onChange={(e) =>
                        handleChange(p.seat_type, "base_price", e.target.value)
                      }
                      className="w-full p-1 bg-black border border-gray-600 rounded text-white"
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.weekend_price}
                      onChange={(e) =>
                        handleChange(p.seat_type, "weekend_price", e.target.value)
                      }
                      className="w-full p-1 bg-black border border-gray-600 rounded text-white"
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.special_price}
                      onChange={(e) =>
                        handleChange(p.seat_type, "special_price", e.target.value)
                      }
                      className="w-full p-1 bg-black border border-gray-600 rounded text-white"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu giá vé"}
      </button>
    </div>
  );
};

export default QuanLyGiaVe;
// src/pages/QuanLyTheTV.jsx
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import axios from "axios";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import SilverCard from "../../components/SilverCard";
import GoldCard from "../../components/GoldCard";
import PlatinumCard from "../../components/PlatinumCard";

export default function QuanLyTheTV() {
  const [tiers, setTiers] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  // form state
  const [memberName, setMemberName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [minPoints,setMinPoints]= useState("")

  // load list
  const fetchTiers = async () => {
    try {
      const res = await axios.get("/api/membershiptiers/");
      const arr = Array.isArray(res.data.membershiptiers)
        ? res.data.membershiptiers
        : [];
      setTiers(arr);
    } catch (err) {
      console.error("Lỗi load membership tiers:", err);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleSelect = (tier) => {
    setSelectedCard(tier);

    setBenefits(tier.benefits || "");
    setMinPoints(tier.min_points)
  };

  const handleClose = () => setSelectedCard(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;

    try {
      await axios.put(`/api/membershiptiers/update/${selectedCard.id}`, {
        benefits,
        min_points:minPoints
      });
      alert("Cập nhật thành công!");
      fetchTiers();
      handleClose();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Cập nhật thất bại!");
    }
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    if (!window.confirm("Bạn có chắc muốn xoá thẻ này?")) return;

    try {
      await axios.delete(`/api/membershiptiers/${selectedCard.id}`);
      alert("Xoá thành công!");
      fetchTiers();
      handleClose();
    } catch (err) {
      console.error("Lỗi xoá:", err);
      alert("Xoá thất bại!");
    }
  };

  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 450,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "120px",
    responsive: [
      { breakpoint: 1024, settings: { centerPadding: "60px" } },
      { breakpoint: 640, settings: { centerPadding: "16px" } },
    ],
  };

  const renderCard = (tier) => {
    const commonProps = {
      name: memberName,
      memberSince: startDate,
      validThrough: endDate,
      hotline: "866 88 8686",
      logoUrl: "/logo.jpg",
    };

    switch (tier.name.toLowerCase()) {
      case "silver":
        return <SilverCard {...commonProps} />;
      case "gold":
        return <GoldCard {...commonProps} />;
      case "platinum":
        return <PlatinumCard {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Quản lý Thẻ Thành Viên</h1>

      <div className="max-w-6xl mx-auto">
        {tiers.length === 0 ? (
          <p className="text-center text-gray-500">
            Không có thẻ nào để hiển thị
          </p>
        ) : (
          <Slider {...settings}>
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="px-4"
                onClick={() => handleSelect(tier)}
              >
                <div className="flex justify-center">{renderCard(tier)}</div>
              </div>
            ))}
          </Slider>
        )}
      </div>

      {/* Modal form */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg w-full relative">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl font-bold"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4">
              Thông tin thẻ {selectedCard.name}
            </h2>

            <form className="space-y-4" onSubmit={handleUpdate}>
              
             
            <div>
  <label className="block font-semibold mb-1">Mức điểm</label>
  <input
    type="number"
    className="border rounded px-3 py-2 w-full"
    value={minPoints}
    onChange={(e) => setMinPoints(Number(e.target.value))}
  />
</div>
            
              <div>
                <label className="block font-semibold mb-1">Quyền lợi</label>
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

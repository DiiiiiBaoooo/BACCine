import React, { useEffect, useState } from "react";
import axios from "axios";

export default function RecruitmentTabs() {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    // Gọi API lấy danh sách cụm rạp
    axios.get("/api/cinemas/")
      .then((res) => {
        setClusters(res.data.cinemas || []);
        if (res.data.length > 0) {
          setSelectedCluster(res.data[0]); // Mặc định chọn tab đầu tiên
        }
      })
      .catch((err) => console.error("Error fetching clusters:", err));
  }, []);

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {clusters.map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => setSelectedCluster(cluster)}
            className={`px-5 py-2 rounded-lg font-medium border transition-all duration-200 ${
              selectedCluster?.id === cluster.id
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-black border-gray-400 hover:bg-red-100"
            }`}
          >
            {cluster.cinema_name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 p-6 border rounded-xl shadow-md bg-white">
        {selectedCluster ? (
          <div>
            <h2 className="text-xl font-bold text-red-600">
              {selectedCluster.cinema_name}
            </h2>
            <p className="mt-3 text-gray-700">
              {/* Nội dung chi tiết từng chi nhánh (nếu API có thêm field thì map ra ở đây) */}
              {selectedCluster.description || "Chưa có thông tin chi tiết."}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Chưa có dữ liệu tuyển dụng.</p>
        )}
      </div>
    </div>
  );
}

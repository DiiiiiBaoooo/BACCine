import React from "react";
import {movies} from "../assets/assets"; // nếu bạn lưu file json cùng thư mục

const KhoPhim = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>🎥 Kho Phim</h2>
      <ul>
        {movies.map((movie) => (
          <li key={movie.id} style={{ marginBottom: "10px" }}>
            {movie.title}{" "}
            <a href={`/xem-phim?url=${encodeURIComponent(movie.url)}`}>
              ▶ Xem
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KhoPhim;

import React from 'react'
import { kConverter } from "../lib/kConverter"
import { dateFormat } from "../lib/dateFormat"
const MovieCard = ({ movie, isSelected, onSelect }) => {
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL

  return (
    <div
    key={movie.id}
    onClick={onSelect}
    className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
  >
    {/* Poster phim */}
    <div className="relative rounded-lg overflow-hidden">
      <img
        src={image_base_url + movie.poster_path}
        alt={movie.title}
        className="w-full object-cover brightness-90"
      />
      {/* Vote + Rating */}
      <div className="text-sm flex items-center justify-between p-2 bg-black/70 absolute bottom-0 left-0 w-full">
        <p className="flex items-center gap-1 text-white">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
        <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
      </div>
    </div>

    {/* Icon check khi chọn */}
    {isSelected && (
      <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
        <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    )}

    {/* Tên + ngày phát hành */}
    <p className="font-medium truncate">{movie.title}</p>
    <p className="text-gray-400 text-sm">{dateFormat(movie.release_date)}</p>
  </div>
  )
}

export default MovieCard

import React from 'react'

const MovieCardSkeleton = ({ delay = 0 }) => {
  return (
    <div 
      className="relative w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer rounded-lg"></div>
      
      {/* Poster skeleton */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="w-40 h-60 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse">
          {/* Shimmer effect on poster */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
        
        {/* Rating bar skeleton */}
        <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-500 rounded animate-pulse"></div>
            <div className="w-8 h-4 bg-gray-500 rounded animate-pulse"></div>
          </div>
          <div className="w-16 h-4 bg-gray-500 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Title skeleton */}
      <div className="mt-2">
        <div className="w-full h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded animate-pulse mb-1">
          <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
      </div>
      
      {/* Date skeleton */}
      <div className="w-20 h-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded animate-pulse">
        <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
      </div>
    </div>
  )
}

export default MovieCardSkeleton

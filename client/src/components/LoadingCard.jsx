import React from 'react'

const LoadingCard = () => {
  return (
    <div className="relative flex flex-col mt-6 text-gray-700 bg-white shadow-md bg-clip-border rounded-xl w-96 overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
      
      {/* Image skeleton */}
      <div className="relative grid h-56 mx-4 mt-4 overflow-hidden text-gray-700 bg-gradient-to-br from-gray-200 to-gray-300 bg-clip-border rounded-xl place-items-center animate-pulse">
        <div className="w-12 h-12 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Title skeleton */}
        <div className="block w-56 h-4 mb-4 font-sans text-5xl antialiased font-semibold leading-tight tracking-normal bg-gradient-to-r from-gray-200 to-gray-300 rounded-full text-inherit animate-pulse">
          <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
        
        {/* Text lines skeleton */}
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="block w-full h-2 mb-2 font-sans text-base antialiased font-light leading-relaxed bg-gradient-to-r from-gray-200 to-gray-300 rounded-full text-inherit animate-pulse"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
        ))}
      </div>
      
      {/* Button skeleton */}
      <div className="p-6 pt-0">
        <div className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg text-white shadow-gray-900/10 hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 shadow-none hover:shadow-none animate-pulse">
          <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
      </div>
      
      {/* Additional loading dots */}
      <div className="absolute bottom-2 right-2 flex space-x-1">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${dot * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  )
}

export default LoadingCard

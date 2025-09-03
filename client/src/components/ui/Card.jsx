import React from "react"

export const Card = ({ children, className }) => {
  return (
    <div className={`rounded-xl border border-gray-800 shadow-md ${className}`}>
      {children}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return <div className={`p-4 ${className}`}>{children}</div>
}

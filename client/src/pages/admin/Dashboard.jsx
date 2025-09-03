import React from 'react'
import { Building, Film, CalendarClock, Users, UserCheck, DollarSign } from 'lucide-react'
import { Card, CardContent } from "../../components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
const Dashboard = () => {
    
const stats = [
    { title: "Tổng số rạp", value: 12, icon: Building },
    { title: "Phim đang chiếu", value: 24, icon: Film },
    { title: "Tổng suất chiếu", value: 158, icon: CalendarClock },
    { title: "Nhân viên", value: 45, icon: Users },
    { title: "Thành viên", value: 1200, icon: UserCheck },
    { title: "Doanh thu", value: "2.5 tỷ", icon: DollarSign },
  ];
  const revenueData = [
    { month: "T1", revenue: 250 },
    { month: "T2", revenue: 320 },
    { month: "T3", revenue: 280 },
    { month: "T4", revenue: 400 },
    { month: "T5", revenue: 350 },
    { month: "T6", revenue: 500 },
  ]

  // Top phim doanh thu cao
  const topMovies = [
    { name: "Avengers: Endgame", revenue: "500M" },
    { name: "Avatar 2", revenue: "450M" },
    { name: "Oppenheimer", revenue: "300M" },
  ]
  return (
    <> 
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
    {stats.map((item, index) => (
      <div
        key={index}
        className="bg-gray-900 text-white rounded-2xl shadow-lg p-5 flex items-center gap-4 hover:scale-[1.02] transition"
      >
        {/* Icon */}
        <div className="p-3 bg-gray-800 rounded-xl">
          <item.icon className="h-8 w-8 text-white" />
        </div>

        {/* Nội dung */}
        <div>
          <p className="text-sm text-gray-400">{item.title}</p>
          <h2 className="text-2xl font-bold">{item.value}</h2>
        </div>
      </div>
    ))}
  </div>
   <div className="p-6 space-y-6">
   {/* Chart Doanh thu */}
   <Card className="bg-gray-900 text-white shadow-lg ">
     <CardContent className="p-4">
       <h2 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h2>
       <div className="h-64">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={revenueData}>
             <XAxis dataKey="month" stroke="#888" />
             <YAxis stroke="#888" />
             <Tooltip />
             <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
           </BarChart>
         </ResponsiveContainer>
       </div>
     </CardContent>
   </Card>

   {/* 3 Stats */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     <Card className="bg-gray-900 text-white shadow-lg">
       <CardContent className="p-4 flex flex-col items-center">
         <p className="text-gray-400">Vé bán hôm nay</p>
         <p className="text-3xl font-bold mt-2">1,250</p>
       </CardContent>
     </Card>

     <Card className="bg-gray-900 text-white shadow-lg">
       <CardContent className="p-4 flex flex-col items-center">
         <p className="text-gray-400">Tỉ lệ lấp đầy ghế</p>
         <p className="text-3xl font-bold mt-2">78%</p>
       </CardContent>
     </Card>

     <Card className="bg-gray-900 text-white shadow-lg">
       <CardContent className="p-4">
         <p className="text-gray-400 mb-2">Top phim doanh thu cao</p>
         <ul className="space-y-2">
           {topMovies.map((movie, i) => (
             <li key={i} className="flex justify-between">
               <span>{movie.name}</span>
               <span className="font-semibold">{movie.revenue}</span>
             </li>
           ))}
         </ul>
       </CardContent>
     </Card>
   </div>
 </div>
 </>
  )
}

export default Dashboard
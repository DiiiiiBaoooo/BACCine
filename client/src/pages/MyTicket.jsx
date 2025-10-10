"use client"

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { getMyTickets } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const TicketCard = ({ ticket, onClick }) => {
  // Parse total_amount as a number
  const totalPrice = parseFloat(ticket.total_amount) || 0;
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(totalPrice);

  // Debug: Log ticket.seats to inspect data
  console.log("Ticket Seats for order_id", ticket.order_id, ticket.seats);

  return (
    <div
      className="border border-red-500 rounded-lg shadow-lg bg-gray-900 overflow-hidden hover:bg-gray-800 transition"
      style={{ position: "relative" }}
      onClick={onClick}
    >
      {/* Logo Placeholder */}
      <div
        className="absolute left-0 top-0 w-12 h-full bg-red-600 flex items-center justify-center"
        style={{ transform: "translateX(-100%)" }}
      >

      </div>

      {/* Status Badge */}
      {ticket.order_status === "pending" && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-semibold bg-yellow-400 text-white">
            Chưa thanh toán
          </span>
        </div>
      )}

      {/* Content Section */}
      <div className="flex items-center p-4 cursor-pointer">
        <img
          src={
            ticket.poster_path.startsWith("http")
              ? ticket.poster_path
              : `https://image.tmdb.org/t/p/w200${ticket.poster_path}`
          }
          alt={ticket.movie_title}
          className="w-24 h-36 object-cover rounded-md mr-4 shadow-lg shadow-red-700/40"
          onError={(e) => (e.target.src = "/placeholder.png")}
        />
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-semibold text-white">{ticket.movie_title}</h3>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{ticket.cinema_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            <span className="text-white font-medium">
              {format(parseISO(ticket.start_time), "HH:mm", { locale: vi })}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">
              {format(parseISO(ticket.end_time), "dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5">
                {ticket.seats && ticket.seats.length > 0 ? (
                  ticket.seats.map((seat) => (
                    <span
                      key={seat.ticket_id} // Ensure unique key
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-white border border-red-500/30"
                    >
                      {seat.seat_number }
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">Không có ghế</span>
                )}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-red-500/50 flex items-center justify-between">
            <span className="text-sm text-gray-400">Tổng tiền</span>
            <span className="text-lg font-bold text-red-500">{formattedPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyTicketsPage() {
  const { isLoading: isAuthLoading, authUser } = useAuthUser();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const {
    data: ticketData,
    isLoading: isTicketsLoading,
    error,
  } = useQuery({
    queryKey: ["myTickets", authUser?.id],
    queryFn: getMyTickets,
    enabled: !!authUser?.id,
    retry: false,
  });

  if (isAuthLoading || isTicketsLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8 text-center text-white">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8 text-center text-red-500">
          Lỗi: {error.message || "Không thể tải danh sách vé"}
        </div>
      </div>
    );
  }

  // Group tickets by order_id
  const ticketsByOrder = ticketData?.success
  ? ticketData.tickets.reduce((acc, ticket) => {
      if (!acc[ticket.order_id]) {
        acc[ticket.order_id] = {
          order_id: ticket.order_id,
          movie_title: ticket.movie_title,
          poster_path: ticket.poster_path,
          cinema_name: ticket.RapChieu,
          start_time: ticket.GioBatDau,
          end_time: ticket.GioKetThuc,
          order_status: ticket.order_status,
          total_amount: parseFloat(ticket.total_amount),
          seats: ticket.seats?.map((s) => ({
            seat_number: s.seat_number,
            ticket_id: s.ticket_id,
            ticket_price: parseFloat(s.ticket_price) || 0,
          })) || [],
        };
      } else {
        const moreSeats =
          ticket.seats?.map((s) => ({
            seat_number: s.seat_number,
            ticket_id: s.ticket_id,
            ticket_price: parseFloat(s.ticket_price) || 0,
          })) || [];
        acc[ticket.order_id].seats.push(...moreSeats);
      }
      return acc;
    }, {})
  : {};


  // Debug: Log ticketsByOrder to inspect grouped data
  console.log("Tickets by Order:", ticketsByOrder);

  const filteredTickets = Object.values(ticketsByOrder).filter((ticket) => {
    if (filter === "all") return true;
    return ticket.order_status === filter;
  });

  const confirmedCount = Object.values(ticketsByOrder).filter((t) => t.order_status === "confirmed").length;
  const pendingCount = Object.values(ticketsByOrder).filter((t) => t.order_status === "pending").length;
  const cancelledCount = Object.values(ticketsByOrder).filter((t) => t.order_status === "cancelled").length;

  const handleCardClick = (orderId) => {
    navigate(`/ticket-details/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-red-500/40 bg-gray-900/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-red-500 mb-6">🎟 Vé của tôi</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-red-500 text-white border border-red-500"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-red-500/40"
            }`}
          >
            Tất cả ({Object.keys(ticketsByOrder).length})
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "confirmed"
                ? "bg-red-500 text-white border border-red-500"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-red-500/40"
            }`}
          >
            Đã xác nhận ({confirmedCount})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "pending"
                ? "bg-red-500 text-white border border-red-500"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-red-500/40"
            }`}
          >
            Chờ thanh toán ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "cancelled"
                ? "bg-red-500 text-white border border-red-500"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-red-500/40"
            }`}
          >
            Đã hủy ({cancelledCount})
          </button>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-400 text-lg">Không có vé nào</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.order_id} // Ensure unique key for TicketCard
                ticket={ticket}
                onClick={() => handleCardClick(ticket.order_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
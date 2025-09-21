import connection from "../config/mysqldb.js";

// GET ticket prices for a cinema (unchanged)
export const getTicketPriceCinema = async (req, res) => {
  try {
    const { cinema_id } = req.params;

    // Validate cinema_id exists in cinema_clusters
    const [cinemaExists] = await connection.query(
      "SELECT id FROM cinema_clusters WHERE id = ?",
      [cinema_id]
    );
    if (!cinemaExists.length) {
      return res.status(404).json({ success: false, message: "Rạp không tồn tại" });
    }

    // Fetch prices for the cinema
    const [rows] = await connection.query(
      `SELECT st.name AS seat_type, tp.base_price, tp.weekend_price, tp.special_price
       FROM ticket_prices tp
       JOIN seat_types st ON tp.seat_type_id = st.id
       WHERE tp.cinema_id = ?
       ORDER BY tp.seat_type_id`,
      [cinema_id]
    );

    // Ensure all expected seat types (Standard, VIP, Couple) are returned
    const expectedSeatTypes = ["Standard", "VIP", "Couple"];
    const result = expectedSeatTypes.map((seatType) => {
      const price = rows.find((row) => row.seat_type === seatType) || {
        seat_type: seatType,
        base_price: "",
        weekend_price: "",
        special_price: "",
      };
      return price;
    });

    res.status(200).json({ success: true, ticket_price: result });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST/UPDATE ticket prices for a cinema
export const saveTicketPrices = async (req, res) => {
    try {
      const { cinema_id, prices } = req.body;
  
      // Validate input
      if (!cinema_id || !Array.isArray(prices) || prices.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Dữ liệu không hợp lệ" });
      }
  
      // Validate cinema_id exists
      const [cinemaExists] = await connection.query(
        "SELECT id FROM cinema_clusters WHERE id = ?",
        [cinema_id]
      );
      if (!cinemaExists.length) {
        return res
          .status(404)
          .json({ success: false, message: "Rạp không tồn tại" });
      }
  
      // Validate seat types and prices
      const validSeatTypes = ["Standard", "VIP", "Couple"];
      for (const price of prices) {
        if (!validSeatTypes.includes(price.seat_type)) {
          return res.status(400).json({
            success: false,
            message: `Loại ghế không hợp lệ: ${price.seat_type}`,
          });
        }
        if (
          isNaN(price.base_price) ||
          isNaN(price.weekend_price) ||
          isNaN(price.special_price) ||
          price.base_price < 0 ||
          price.weekend_price < 0 ||
          price.special_price < 0
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Giá vé không hợp lệ" });
        }
      }
  
      // UPDATE prices (chỉ cập nhật, không insert mới)
      const updateQuery = `
        UPDATE ticket_prices
        SET base_price = ?, weekend_price = ?, special_price = ?, updated_at = NOW()
        WHERE cinema_id = ? AND seat_type_id = (SELECT id FROM seat_types WHERE name = ?)
      `;
  
      for (const price of prices) {
        await connection.query(updateQuery, [
          price.base_price,
          price.weekend_price,
          price.special_price,
          cinema_id,
          price.seat_type,
        ]);
      }
  
      res.status(200).json({ success: true, message: "Cập nhật giá vé thành công!" });
    } catch (error) {
      console.error(error.message);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server" });
    }
  };
  
  // Lấy giá vé cho rạp và ngày cụ thể
  export const getTicketPricesByCinemaAndDate = async (req, res) => {
    try {
      const { cinemaId, date } = req.params;
  
      // Validate params
      if (!cinemaId || !date) {
        return res.status(400).json({ success: false, message: "Missing cinemaId or date" });
      }
  
      const queryDate = new Date(date).toISOString().split('T')[0]; // Ensure YYYY-MM-DD format
  
      // Check if there are showtimes for the given cinema and date
      const [showtimeCheck] = await connection.query(
        `SELECT COUNT(*) as count
         FROM showtimes s
         JOIN rooms r ON s.room_id = r.id
         WHERE r.cinema_clusters_id = ? AND DATE(s.start_time) = ?`,
        [cinemaId, queryDate]
      );
  
      if (showtimeCheck[0].count === 0) {
        return res.status(404).json({ success: false, message: "No showtimes available for this cinema and date" });
      }
  
      // Fetch ticket prices for all seat types
      const [prices] = await connection.query(
        `SELECT st.name AS seat_type, tp.base_price, tp.weekend_price, tp.special_price
         FROM ticket_prices tp
         JOIN seat_types st ON tp.seat_type_id = st.id
         JOIN cinema_clusters c ON tp.cinema_id = c.id
         WHERE c.id = ? AND tp.updated_at <= ?`,
        [cinemaId, new Date(`${queryDate} 23:59:59`)]
      );
  
      if (prices.length === 0) {
        return res.status(404).json({ success: false, message: "No ticket prices found for this cinema" });
      }
  
      // Determine if it's a weekend
      const isWeekend = new Date(queryDate).getDay() >= 5; // Saturday (6) or Sunday (0)
  
      // Calculate effective price for each seat type
      const ticketPrices = prices.map((priceRow) => ({
        seat_type: priceRow.seat_type,
        base_price: priceRow.base_price,
        weekend_price: priceRow.weekend_price,
        special_price: priceRow.special_price,
        effective_price: isWeekend
          ? priceRow.weekend_price || priceRow.base_price
          : priceRow.special_price && priceRow.special_price > 0
          ? priceRow.special_price
          : priceRow.base_price,
        cinema_id: parseInt(cinemaId),
        cinema_name: prices[0]?.cinema_name || "",
        date: queryDate,
        is_weekend: isWeekend,
      }));
  
      // Ensure all expected seat types are included
      const expectedSeatTypes = ["Standard", "VIP", "Couple"];
      const responseData = expectedSeatTypes.map((seatType) => {
        const price = ticketPrices.find((p) => p.seat_type === seatType) || {
          seat_type: seatType,
          base_price: 0,
          weekend_price: 0,
          special_price: 0,
          effective_price: 0,
          cinema_id: parseInt(cinemaId),
          cinema_name: "",
          date: queryDate,
          is_weekend: isWeekend,
        };
        return price;
      });
  
      res.status(200).json({ success: true, ticket_price: responseData });
    } catch (error) {
      console.error("Error in getTicketPricesByCinemaAndDate:", error.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
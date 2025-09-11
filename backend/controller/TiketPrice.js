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
  
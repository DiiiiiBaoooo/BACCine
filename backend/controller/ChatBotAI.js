// backend/controller/OpenAIChatbot.js
import OpenAI from 'openai';
import dbPool from '../config/mysqldb.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const conversationHistory = new Map();

const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của hệ thống rạp chiếu phim BAC Cinema. 
Nhiệm vụ của bạn là:
1. Tư vấn và hỗ trợ khách hàng đặt vé xem phim
2. Tra cứu thông tin về phim đang chiếu, suất chiếu
3. Cung cấp thông tin về các rạp chiếu phim
4. Hỗ trợ tra cứu giá vé, khuyến mãi
5. Giải đáp thắc mắc về dịch vụ
6. HỖ TRỢ ĐẶT VÉ TRỰC TIẾP qua chatbot

QUY TRÌNH ĐẶT VÉ:
1. Khách chọn phim → Gọi get_movies_showing
2. Khách chọn suất chiếu → Gọi get_showtimes
3. Khách chọn ghế → Gọi get_available_seats
4. Xác nhận đặt vé → Gọi create_booking (cần: showtime_id, seat_ids, user_id hoặc phone)
5. Sau khi đặt vé thành công, cung cấp link thanh toán QR

Hãy trả lời một cách thân thiện, chuyên nghiệp và chính xác. 
Luôn trả lời bằng tiếng Việt và format thông tin rõ ràng, dễ đọc.`;

// Extended Function definitions
const FUNCTIONS = [
  {
    name: 'get_movies_showing',
    description: 'Lấy danh sách phim đang chiếu',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Số lượng phim muốn lấy (mặc định 5)'
        }
      }
    }
  },
  {
    name: 'get_movie_details',
    description: 'Lấy thông tin chi tiết về một bộ phim',
    parameters: {
      type: 'object',
      properties: {
        movie_id: {
          type: 'number',
          description: 'ID của phim'
        }
      },
      required: ['movie_id']
    }
  },
  {
    name: 'get_showtimes',
    description: 'Lấy lịch chiếu của một phim',
    parameters: {
      type: 'object',
      properties: {
        movie_id: {
          type: 'number',
          description: 'ID của phim'
        },
        cinema_id: {
          type: 'number',
          description: 'ID của rạp (optional)'
        },
        date: {
          type: 'string',
          description: 'Ngày chiếu (YYYY-MM-DD) (optional)'
        }
      },
      required: ['movie_id']
    }
  },
  {
    name: 'get_available_seats',
    description: 'Lấy danh sách ghế trống của một suất chiếu',
    parameters: {
      type: 'object',
      properties: {
        showtime_id: {
          type: 'number',
          description: 'ID của suất chiếu'
        }
      },
      required: ['showtime_id']
    }
  },
  {
    name: 'get_cinemas',
    description: 'Lấy danh sách các rạp chiếu phim',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_ticket_prices',
    description: 'Lấy thông tin giá vé của một rạp',
    parameters: {
      type: 'object',
      properties: {
        cinema_id: {
          type: 'number',
          description: 'ID của rạp'
        }
      },
      required: ['cinema_id']
    }
  },
  {
    name: 'get_promotions',
    description: 'Lấy danh sách khuyến mãi đang có',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_booking',
    description: 'Tạo đơn đặt vé (yêu cầu showtime_id, seat_ids, và user_id hoặc phone)',
    parameters: {
      type: 'object',
      properties: {
        showtime_id: {
          type: 'number',
          description: 'ID suất chiếu'
        },
        seat_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Danh sách ID ghế (ví dụ: [1, 2, 3])'
        },
        user_id: {
          type: 'number',
          description: 'ID người dùng (optional nếu có phone)'
        },
        phone: {
          type: 'string',
          description: 'Số điện thoại (bắt buộc nếu không có user_id)'
        },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service_id: { type: 'number' },
              quantity: { type: 'number' }
            }
          },
          description: 'Danh sách dịch vụ đặt thêm (optional)'
        },
        promotion_id: {
          type: 'number',
          description: 'ID khuyến mãi (optional)'
        }
      },
      required: ['showtime_id', 'seat_ids']
    }
  }
];

// Function implementations
async function getMoviesShowing(limit = 5) {
  try {
    const [movies] = await dbPool.query(`
      SELECT DISTINCT 
        m.id, m.title, m.poster_path, m.vote_average, 
        m.release_date, m.runtime, m.overview
      FROM movies m
      JOIN showtimes s ON m.id = s.movie_id
      WHERE s.status IN ('Ongoing', 'Scheduled')
        AND DATE(s.start_time) >= CURDATE()
      ORDER BY m.release_date DESC
      LIMIT ?
    `, [limit]);

    return {
      success: true,
      data: movies,
      message: `Tìm thấy ${movies.length} phim đang chiếu`
    };
  } catch (error) {
    console.error('Error getting movies:', error);
    return { success: false, message: 'Lỗi khi lấy danh sách phim' };
  }
}

async function getMovieDetails(movie_id) {
  try {
    const [movies] = await dbPool.query(`
      SELECT 
        m.*,
        GROUP_CONCAT(DISTINCT g.name) as genres
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE m.id = ?
      GROUP BY m.id
    `, [movie_id]);

    if (movies.length === 0) {
      return { success: false, message: 'Không tìm thấy phim' };
    }

    return {
      success: true,
      data: movies[0],
      message: 'Thông tin phim'
    };
  } catch (error) {
    console.error('Error getting movie details:', error);
    return { success: false, message: 'Lỗi khi lấy thông tin phim' };
  }
}

async function getShowtimes(movie_id, cinema_id = null, date = null) {
  try {
    let query = `
      SELECT 
        s.id as showtime_id,
        s.start_time,
        s.end_time,
        r.name as room_name,
        r.id as room_id,
        c.name as cinema_name,
        c.id as cinema_id
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN cinema_clusters c ON r.cinema_clusters_id = c.id
      WHERE s.movie_id = ?
        AND s.status IN ('Ongoing', 'Scheduled')
        AND DATE(s.start_time) >= CURDATE()
    `;
    
    const params = [movie_id];

    if (cinema_id) {
      query += ' AND c.id = ?';
      params.push(cinema_id);
    }

    if (date) {
      query += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }

    query += ' ORDER BY s.start_time ASC LIMIT 20';

    const [showtimes] = await dbPool.query(query, params);

    return {
      success: true,
      data: showtimes,
      message: `Tìm thấy ${showtimes.length} suất chiếu`
    };
  } catch (error) {
    console.error('Error getting showtimes:', error);
    return { success: false, message: 'Lỗi khi lấy lịch chiếu' };
  }
}

async function getAvailableSeats(showtime_id) {
  try {
    const [seats] = await dbPool.query(`
      SELECT 
        ss.seat_id,
        ss.seat_number,
        ss.status,
        st.name as seat_type,
        st.id as seat_type_id,
        CASE 
          WHEN DAYOFWEEK(DATE(s.start_time)) IN (1, 7) THEN tp.weekend_price
          ELSE tp.base_price 
        END AS ticket_price
      FROM show_seats ss
      JOIN showtimes s ON ss.showtime_id = s.id
      JOIN seat_types st ON ss.seat_type_id = st.id
      JOIN rooms r ON s.room_id = r.id
      JOIN cinema_clusters c ON r.cinema_clusters_id = c.id
      JOIN ticket_prices tp ON st.id = tp.seat_type_id AND tp.cinema_id = c.id
      WHERE ss.showtime_id = ?
        AND ss.status = 'available'
      ORDER BY ss.seat_number
    `, [showtime_id]);

    return {
      success: true,
      data: seats,
      message: `Có ${seats.length} ghế trống`
    };
  } catch (error) {
    console.error('Error getting seats:', error);
    return { success: false, message: 'Lỗi khi lấy thông tin ghế' };
  }
}

async function getCinemas() {
  try {
    const [cinemas] = await dbPool.query(`
      SELECT id, name, address, phone, email
      FROM cinema_clusters
      WHERE status = 'active'
      ORDER BY name
    `);

    return {
      success: true,
      data: cinemas,
      message: `Có ${cinemas.length} rạp đang hoạt động`
    };
  } catch (error) {
    console.error('Error getting cinemas:', error);
    return { success: false, message: 'Lỗi khi lấy danh sách rạp' };
  }
}

async function getTicketPrices(cinema_id) {
  try {
    const [prices] = await dbPool.query(`
      SELECT 
        st.name as seat_type,
        tp.base_price,
        tp.weekend_price,
        tp.special_price
      FROM ticket_prices tp
      JOIN seat_types st ON tp.seat_type_id = st.id
      WHERE tp.cinema_id = ?
    `, [cinema_id]);

    return {
      success: true,
      data: prices,
      message: 'Bảng giá vé'
    };
  } catch (error) {
    console.error('Error getting ticket prices:', error);
    return { success: false, message: 'Lỗi khi lấy giá vé' };
  }
}

async function getPromotions() {
  try {
    const [promotions] = await dbPool.query(`
      SELECT 
        id, name, description, discount_type, discount_value,
        start_date, end_date
      FROM promotions
      WHERE status = 'active'
        AND start_date <= CURDATE()
        AND end_date >= CURDATE()
      ORDER BY created_at DESC
    `);

    return {
      success: true,
      data: promotions,
      message: `Có ${promotions.length} chương trình khuyến mãi`
    };
  } catch (error) {
    console.error('Error getting promotions:', error);
    return { success: false, message: 'Lỗi khi lấy khuyến mãi' };
  }
}

// NEW: Create booking function
// NEW: Create booking function - FIXED VERSION
async function createBooking(args) {
  const connection = await dbPool.getConnection();
  try {
    const { showtime_id, seat_ids, user_id, phone, services = [], promotion_id } = args;

    // Validate required fields
    if (!showtime_id || !seat_ids || seat_ids.length === 0) {
      return { success: false, message: 'Thiếu thông tin suất chiếu hoặc ghế' };
    }

    if (!user_id && !phone) {
      return { success: false, message: 'Vui lòng cung cấp user_id hoặc số điện thoại' };
    }

    await connection.beginTransaction();

    // 1. Get showtime and cinema info
    const [showtimeRows] = await connection.query(`
      SELECT s.id, s.movie_id, s.start_time, r.cinema_clusters_id as cinema_id
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ?
    `, [showtime_id]);

    if (showtimeRows.length === 0) {
      await connection.rollback();
      return { success: false, message: 'Suất chiếu không tồn tại' };
    }

    const cinema_id = showtimeRows[0].cinema_id;
    const start_time = showtimeRows[0].start_time;

    console.log('📍 Cinema ID:', cinema_id);
    console.log('📅 Start time:', start_time);

    // 2. Get seat details and prices
    const [seatRows] = await connection.query(`
      SELECT 
        ss.seat_id,
        ss.seat_number,
        ss.status,
        ss.seat_type_id,
        st.name as seat_type_name,
        tp.base_price,
        tp.weekend_price,
        CASE 
          WHEN DAYOFWEEK(?) IN (1, 7) THEN COALESCE(tp.weekend_price, tp.base_price, 0)
          ELSE COALESCE(tp.base_price, 0)
        END AS ticket_price
      FROM show_seats ss
      JOIN seat_types st ON ss.seat_type_id = st.id
      LEFT JOIN ticket_prices tp ON st.id = tp.seat_type_id AND tp.cinema_id = ?
      WHERE ss.showtime_id = ?
        AND ss.seat_id IN (?)
    `, [start_time, cinema_id, showtime_id, seat_ids]);

    console.log('🎫 Seat rows found:', seatRows.length);
    console.log('🎫 Seat details:', seatRows);

    if (seatRows.length !== seat_ids.length) {
      await connection.rollback();
      return { success: false, message: 'Một hoặc nhiều ghế không tồn tại' };
    }

    // Check seat availability
    for (const seat of seatRows) {
      if (seat.status !== 'available') {
        await connection.rollback();
        return { success: false, message: `Ghế ${seat.seat_number} đã được đặt` };
      }
    }

    // Check if any seat has null/undefined price
    const hasInvalidPrice = seatRows.some(seat => 
      seat.ticket_price === null || 
      seat.ticket_price === undefined || 
      isNaN(seat.ticket_price)
    );

    if (hasInvalidPrice) {
      await connection.rollback();
      console.error('❌ Invalid ticket prices found:', seatRows);
      return { 
        success: false, 
        message: `Không tìm thấy giá vé cho rạp này. Vui lòng liên hệ quản trị viên.` 
      };
    }

    // 3. Calculate ticket total - ENSURE IT'S A NUMBER
    const ticket_total = seatRows.reduce((sum, seat) => {
      const price = Number(seat.ticket_price) || 0;
      return sum + price;
    }, 0);

    console.log('💰 Ticket total:', ticket_total);

    // 4. Build tickets array
    const tickets = seatRows.map(seat => ({
      seat_id: seat.seat_id,
      seat_number: seat.seat_number,
      ticket_price: Number(seat.ticket_price) || 0
    }));

    // 5. Calculate service total - ENSURE IT'S A NUMBER
    let service_total = 0;
    if (services.length > 0) {
      const serviceIds = services.map(s => s.service_id);
      const [serviceRows] = await connection.query(
        'SELECT id, price FROM services WHERE id IN (?)',
        [serviceIds]
      );

      for (const service of services) {
        const serviceData = serviceRows.find(s => s.id === service.service_id);
        if (!serviceData) {
          await connection.rollback();
          return { success: false, message: `Dịch vụ ${service.service_id} không tồn tại` };
        }
        const servicePrice = Number(serviceData.price) || 0;
        const quantity = Number(service.quantity) || 0;
        service_total += servicePrice * quantity;
      }
    }

    console.log('🍿 Service total:', service_total);

    // 6. Calculate discount - ENSURE IT'S A NUMBER
    let discount_amount = 0;
    if (promotion_id) {
      const [promotionRows] = await connection.query(
        'SELECT discount_type, discount_value, min_order, max_discount FROM promotions WHERE id = ?',
        [promotion_id]
      );

      if (promotionRows.length > 0) {
        const promotion = promotionRows[0];
        const subtotal = ticket_total + service_total;
        const minOrder = Number(promotion.min_order) || 0;

        if (subtotal >= minOrder) {
          const type = (promotion.discount_type || '').toLowerCase();
          const value = Number(promotion.discount_value) || 0;

          if (type === 'percent') {
            discount_amount = (subtotal * value) / 100;
            const maxDiscount = Number(promotion.max_discount) || 0;
            if (maxDiscount > 0) {
              discount_amount = Math.min(discount_amount, maxDiscount);
            }
          } else if (type === 'fixed') {
            discount_amount = value;
          }

          discount_amount = Math.min(discount_amount, subtotal);
          discount_amount = Math.max(0, Math.floor(discount_amount));
        }
      }
    }

    console.log('🎁 Discount amount:', discount_amount);

    // 7. Calculate grand total - FINAL VALIDATION
    const grand_total = Math.max(0, Math.floor(ticket_total + service_total - discount_amount));

    // CRITICAL: Validate grand_total is a valid number
    if (isNaN(grand_total) || grand_total === null || grand_total === undefined) {
      await connection.rollback();
      console.error('❌ Invalid grand_total calculated:', {
        ticket_total,
        service_total,
        discount_amount,
        grand_total
      });
      return { 
        success: false, 
        message: 'Lỗi khi tính tổng tiền. Vui lòng thử lại.' 
      };
    }

    console.log('💵 Grand total:', grand_total);

    // 8. Auto-confirm if free
    const status = grand_total === 0 ? 'confirmed' : 'pending';

    // 9. Create order
    const [bookingResult] = await connection.query(
      `INSERT INTO orders (
        user_id, showtime_id, order_date, status, payment_method, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, showtime_id, new Date(), status, 'qr code', grand_total]
    );

    const order_id = bookingResult.insertId;

    // 10. Insert tickets
    for (const ticket of tickets) {
      await connection.query(
        'INSERT INTO orderticket (order_id, showtime_id, seat_id, ticket_price) VALUES (?, ?, ?, ?)',
        [order_id, showtime_id, ticket.seat_id, ticket.ticket_price]
      );
    }

    // 11. Insert services
    if (services.length > 0) {
      for (const service of services) {
        const [priceRow] = await connection.query(
          'SELECT price FROM services WHERE id = ?',
          [service.service_id]
        );
        const price = Number(priceRow[0].price) || 0;

        await connection.query(
          'INSERT INTO orderservice (order_id, service_id, quantity, service_price) VALUES (?, ?, ?, ?)',
          [order_id, service.service_id, service.quantity, price]
        );

        await connection.query(
          'UPDATE services SET quantity = quantity - ? WHERE id = ?',
          [service.quantity, service.service_id]
        );
      }
    }

    // 12. Update seats
    const seatStatus = status === 'confirmed' ? 'booked' : 'reserved';
    await connection.query(
      `UPDATE show_seats SET status = ?, reservation_id = ?, updated_at = NOW()
       WHERE showtime_id = ? AND seat_id IN (?)`,
      [seatStatus, order_id, showtime_id, seat_ids]
    );

    // 13. Update promotion
    if (promotion_id) {
      await connection.query(
        'UPDATE promotions SET used_count = used_count + 1 WHERE id = ?',
        [promotion_id]
      );
    }

    await connection.commit();

    // Generate payment URL
    const paymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/qr-payment?order_id=${order_id}&grand_total=${grand_total}`;

    return {
      success: true,
      message: 'Đặt vé thành công! Vui lòng thanh toán để hoàn tất.',
      data: {
        order_id,
        showtime_id,
        tickets,
        services,
        ticket_total,
        service_total,
        discount_amount,
        grand_total,
        status,
        payment_url: paymentUrl
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating booking:', error);
    return { 
      success: false, 
      message: `Lỗi khi tạo đơn: ${error.message}` 
    };
  } finally {
    connection.release();
  }
}

// Execute function calls
async function executeFunctionCall(functionName, args) {
  switch (functionName) {
    case 'get_movies_showing':
      return await getMoviesShowing(args.limit);
    case 'get_movie_details':
      return await getMovieDetails(args.movie_id);
    case 'get_showtimes':
      return await getShowtimes(args.movie_id, args.cinema_id, args.date);
    case 'get_available_seats':
      return await getAvailableSeats(args.showtime_id);
    case 'get_cinemas':
      return await getCinemas();
    case 'get_ticket_prices':
      return await getTicketPrices(args.cinema_id);
    case 'get_promotions':
      return await getPromotions();
    case 'create_booking':
      return await createBooking(args);
    default:
      return { success: false, message: 'Function không tồn tại' };
  }
}

// Main chat endpoint
export const chat = async (req, res) => {
  try {
    const { message, userId, userPhone } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    const sessionId = userId || userPhone || 'anonymous';

    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, [
        { role: 'system', content: SYSTEM_PROMPT }
      ]);
    }

    const history = conversationHistory.get(sessionId);
    history.push({ role: 'user', content: message });

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: history,
      functions: FUNCTIONS,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 1500
    });

    let assistantMessage = response.choices[0].message;

    // Handle function calls
    while (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      // Inject user context for booking
      if (functionName === 'create_booking') {
        if (userId) functionArgs.user_id = userId;
        if (userPhone) functionArgs.phone = userPhone;
      }

      console.log(`🔧 Calling function: ${functionName}`, functionArgs);

      const functionResult = await executeFunctionCall(functionName, functionArgs);

      history.push(assistantMessage);
      history.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      });

      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: history,
        functions: FUNCTIONS,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1500
      });

      assistantMessage = response.choices[0].message;
    }

    history.push(assistantMessage);

    if (history.length > 21) {
      const systemMsg = history[0];
      conversationHistory.set(sessionId, [
        systemMsg,
        ...history.slice(-20)
      ]);
    }

    res.json({
      success: true,
      response: assistantMessage.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xử lý tin nhắn',
      details: error.message
    });
  }
};

export const resetConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = userId || 'anonymous';
    conversationHistory.delete(sessionId);
    res.json({
      success: true,
      message: 'Đã reset cuộc hội thoại'
    });
  } catch (error) {
    console.error('Reset conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi reset conversation'
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionId = userId || 'anonymous';
    const history = conversationHistory.get(sessionId) || [];
    res.json({
      success: true,
      history: history.filter(msg => msg.role !== 'system')
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy history'
    });
  }
};
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import parse from 'html-react-parser';
import { useNavigate } from 'react-router-dom';

const RasaChatbot = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const senderId = useRef(`user_${currentUser?.id || Date.now()}`);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: '👋 Xin chào! Tôi là trợ lý AI đặt vé xem phim.\n\nTôi có thể giúp bạn:\n• 🎬 Xem lịch chiếu phim\n• 🎫 Đặt vé xem phim\n• 🪑 Kiểm tra ghế trống\n• 🏢 Thông tin rạp chiếu\n• 💰 Hướng dẫn thanh toán\n\nBạn cần tôi giúp gì?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const sendMessageToRasa = async (message) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}api/chatbot/message`,
        {
          sender: senderId.current,
          message: message,
          metadata: {
            userId: currentUser?.id,
            cinemaId: currentUser?.cinemaId,
          },
        }
      );

      if (response.data.success && response.data.responses) {
        console.log('Rasa responses:', response.data.responses);
        return response.data.responses.map(resp => ({
          text: typeof resp.text === 'string' ? resp.text : '',
          sender: 'bot',
          timestamp: new Date(),
          buttons: resp.buttons || [],
          image: resp.image || null,
          custom: resp.custom || null,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error sending message to RASA:', error);
      return [
        {
          text: '❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        },
      ];
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const botResponses = await sendMessageToRasa(inputMessage);

      setIsTyping(false);

      if (botResponses.length > 0) {
        const newMessages = botResponses.map((resp) => ({
          text: typeof resp.text === 'string' ? resp.text : '',
          sender: 'bot',
          timestamp: new Date(),
          buttons: resp.buttons,
          image: resp.image,
          custom: resp.custom,
        }));

        setMessages((prev) => [...prev, ...newMessages]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Error in sendMessage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleButtonClick = async (payload) => {
    const buttonMessage = {
      text: payload,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, buttonMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const botResponses = await sendMessageToRasa(payload);
      setIsTyping(false);

      if (botResponses.length > 0) {
        const newMessages = botResponses.map((resp) => ({
          text: typeof resp.text === 'string' ? resp.text : '',
          sender: 'bot',
          timestamp: new Date(),
          buttons: resp.buttons,
          image: resp.image,
          custom: resp.custom,
        }));

        setMessages((prev) => [...prev, ...newMessages]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Error handling button click:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/chatbot/reset/${senderId.current}`
      );
      setMessages([
        {
          text: '🔄 Cuộc hội thoại đã được reset. Tôi có thể giúp gì cho bạn?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group"
          aria-label="Open chatbot"
        >
          <Bot className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Trợ lý AI
          </span>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Trợ lý AI</h3>
                <p className="text-xs text-blue-100">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetConversation}
                className="hover:bg-white/20 rounded-lg p-2 transition-colors text-xs"
                title="Reset cuộc trò chuyện"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'bot'
                      ? 'bg-white shadow-md border border-gray-100'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  }`}
                >
                  {/* Parse HTML content with fallback */}
                  <div className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                    {typeof msg.text === 'string' && msg.text.trim() ? (
                      parse(msg.text)
                    ) : (
                      <span>Không có nội dung</span>
                    )}
                  </div>

                  {/* Custom Payload */}
                  {msg.custom && msg.custom.bookingData && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p><strong>Mã đơn hàng:</strong> {msg.custom.bookingData.order_id}</p>
                      <p><strong>Tổng tiền:</strong> {msg.custom.bookingData.grand_total.toLocaleString('vi-VN')} VND</p>
                      {msg.custom.bookingData.payment_url && (
                        <button
                          onClick={() =>
                            navigate(
                              `/qr-payment?order_id=${encodeURIComponent(
                                msg.custom.bookingData.order_id
                              )}&grand_total=${encodeURIComponent(
                                msg.custom.bookingData.grand_total
                              )}`,
                              {
                                state: { bookingData: msg.custom.bookingData },
                              }
                            )
                          }
                          className="mt-2 inline-block px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
                        >
                          Go to Payment
                        </button>
                      )}
                    </div>
                  )}

                  {/* Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.buttons.map((button, btnIndex) => (
                        <button
                          key={btnIndex}
                          onClick={() => handleButtonClick(button.payload)}
                          className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all hover:shadow-md"
                        >
                          {button.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Image */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Preview"
                      className="mt-3 rounded-lg max-w-full shadow-md"
                    />
                  )}

                  <p className="text-xs mt-2 opacity-60">
                    {msg.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {msg.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border text-black border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl px-4 py-3 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by RASA AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RasaChatbot;
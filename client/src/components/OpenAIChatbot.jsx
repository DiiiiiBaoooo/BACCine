// client/src/components/OpenAIChatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, RotateCcw, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './OpenAIChatBot.css';

const OpenAIChatbot = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của BAC Cinema. Tôi có thể giúp bạn:\n\n• Tìm phim đang chiếu\n• Xem lịch chiếu\n• Tra cứu giá vé\n• Thông tin rạp chiếu\n• Khuyến mãi hiện có\n\nBạn cần hỗ trợ gì?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Send message to OpenAI chatbot
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/ai-chatbot/chat`, {
        message: inputMessage,
        userId: currentUser?.id || 'anonymous'
      });

      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.data.error || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Reset conversation
  const resetConversation = async () => {
    try {
      await axios.post(`${API_BASE}/api/ai-chatbot/reset`, {
        userId: currentUser?.id || 'anonymous'
      });

      setMessages([
        {
          role: 'assistant',
          content: 'Cuộc hội thoại đã được reset. Bạn cần hỗ trợ gì?',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Quick action buttons
  const quickActions = [
    { label: '🎬 Phim đang chiếu', message: 'Cho tôi xem các phim đang chiếu' },
    { label: '🎫 Giá vé', message: 'Giá vé bao nhiêu?' },
    { label: '🏢 Danh sách rạp', message: 'Có những rạp nào?' },
    { label: '🎁 Khuyến mãi', message: 'Có khuyến mãi gì không?' }
  ];

  const handleQuickAction = (message) => {
    setInputMessage(message);
    inputRef.current?.focus();
  };

  return (
    <div className="openai-chatbot-container">
      {/* Chat Button */}
      {!isOpen && (
        <button
          className="openai-chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Mở chat"
        >
          <MessageCircle size={24} />
          <span className="chat-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="openai-chat-window">
          {/* Header */}
          <div className="openai-chat-header">
            <div className="openai-chat-header-info">
              <div className="openai-chat-avatar">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3>BAC Cinema AI</h3>
                <span className="openai-chat-status">
                  <span className="status-dot"></span>
                  Trực tuyến
                </span>
              </div>
            </div>
            <div className="openai-chat-header-actions">
              <button
                onClick={resetConversation}
                className="openai-icon-btn"
                title="Reset cuộc hội thoại"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="openai-icon-btn"
                title="Đóng chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="openai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`openai-message ${msg.role} ${msg.isError ? 'error' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="openai-message-avatar">
                    <MessageCircle size={16} />
                  </div>
                )}
                <div className="openai-message-content">
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <span className="openai-message-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="openai-message assistant">
                <div className="openai-message-avatar">
                  <MessageCircle size={16} />
                </div>
                <div className="openai-message-content">
                  <div className="openai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="openai-quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="openai-quick-action-btn"
                  onClick={() => handleQuickAction(action.message)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="openai-chat-input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="openai-chat-input"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="openai-send-btn"
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? <Loader size={20} className="spinner" /> : <Send size={20} />}
            </button>
          </div>

          {/* Footer */}
          <div className="openai-chat-footer">
            <span>Powered by OpenAI GPT-4</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAIChatbot;
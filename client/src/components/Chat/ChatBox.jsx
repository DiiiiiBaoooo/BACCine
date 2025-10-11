// ChatBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import ChatService from '../../../../backend/services/chat.service'

function ChatBox({ conversationId, currentUserId, currentUserType, onMessageSent }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
  
    useEffect(() => {
      if (!conversationId) return;
  
      // Lắng nghe tin nhắn realtime
      const unsubscribe = ChatService.listenToMessages(conversationId, (msgs) => {
        setMessages(msgs);
        scrollToBottom();
        
        // Đánh dấu tin nhắn đã đọc
        ChatService.markAllAsRead(conversationId, currentUserId);
      });
  
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [conversationId, currentUserId]);
  
    const scrollToBottom = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
  
    const handleSendMessage = async (e) => {
      e.preventDefault();
      
      const messageText = newMessage.trim();
      if (!messageText || sending) return;
  
      try {
        setSending(true);
        await ChatService.sendMessage(
          conversationId,
          currentUserId,
          currentUserType,
          messageText
        );
        
        setNewMessage('');
        
        if (onMessageSent) {
          onMessageSent();
        }
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
      } finally {
        setSending(false);
      }
    };
  
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    };
  
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      if (date.toDateString() === now.toDateString()) {
        return `${hours}:${minutes}`;
      }
      
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    return (
      <div className="chat-box">
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <p>Chưa có tin nhắn nào</p>
              <p className="no-messages-hint">Gửi tin nhắn để bắt đầu trò chuyện</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isSent = msg.sender_id === currentUserId;
                const showAvatar = index === 0 || 
                  messages[index - 1].sender_id !== msg.sender_id;
                
                return (
                  <div 
                    key={msg.id} 
                    className={`message ${isSent ? 'sent' : 'received'}`}
                  >
                    {!isSent && showAvatar && (
                      <div className="message-avatar">👤</div>
                    )}
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {formatTime(msg.timestamp)}
                        {isSent && (
                          <span className="message-status">
                            {msg.read ? ' ✓✓' : ' ✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
  
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={sending}
            maxLength={1000}
          />
          <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className={sending ? 'sending' : ''}
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    );
  }
  
  export default ChatBox;
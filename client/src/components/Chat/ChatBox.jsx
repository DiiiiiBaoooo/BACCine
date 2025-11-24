// ChatBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import ChatService from '../../lib/chatservice';

function ChatBox({ conversationId, currentUserId, currentUserType, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = ChatService.listenToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
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

  // Xử lý chọn file
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File không được vượt quá 10MB!');
      return;
    }

    setSelectedFile(file);

    // Tạo preview cho ảnh
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Xóa file đã chọn
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if ((!messageText && !selectedFile) || sending) return;

    try {
      setSending(true);
      setUploading(!!selectedFile);

      let fileData = null;

      // Upload file nếu có
      if (selectedFile) {
        fileData = await ChatService.uploadFile(selectedFile, conversationId);
      }

      // Gửi tin nhắn
      await ChatService.sendMessage(
        conversationId,
        currentUserId,
        currentUserType,
        messageText,
        fileData
      );
      
      setNewMessage('');
      handleRemoveFile();
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
      setUploading(false);
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type === 'image') return '🖼️';
    if (type === 'video') return '🎥';
    if (type === 'audio') return '🎵';
    if (type === 'pdf') return '📄';
    if (type === 'document') return '📝';
    if (type === 'spreadsheet') return '📊';
    return '📎';
  };

  // Render nội dung tin nhắn
  const renderMessageContent = (msg) => {
    if (msg.message_type === 'image' && msg.file) {
      return (
        <div className="message-file">
          <img 
            src={msg.file.url} 
            alt={msg.file.name}
            className="message-image"
            onClick={() => window.open(msg.file.url, '_blank')}
          />
          {msg.content && <p className="file-caption">{msg.content}</p>}
        </div>
      );
    }

    if (msg.file) {
      return (
        <div className="message-file">
          <a 
            href={msg.file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="file-attachment"
          >
            <span className="file-icon">{getFileIcon(msg.message_type)}</span>
            <div className="file-info">
              <span className="file-name">{msg.file.name}</span>
              <span className="file-size">{formatFileSize(msg.file.size)}</span>
            </div>
          </a>
          {msg.content && <p className="file-caption">{msg.content}</p>}
        </div>
      );
    }

    return <div className="message-text">{msg.content}</div>;
  };

  return (
    <div className="chat-box">
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p className="no-messages-hint">Gửi tin nhắn hoặc file để bắt đầu trò chuyện</p>
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
                    <div className="message-content">
                      {renderMessageContent(msg)}
                    </div>
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

      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview-container">
          <div className="file-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="preview-image" />
            ) : (
              <div className="preview-file">
                <span className="preview-icon">{getFileIcon(ChatService.getMessageType(selectedFile.type))}</span>
                <span className="preview-name">{selectedFile.name}</span>
              </div>
            )}
            <button 
              className="remove-file-btn" 
              onClick={handleRemoveFile}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Đính kèm file"
        >
          📎
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedFile ? "Thêm chú thích (tùy chọn)..." : "Nhập tin nhắn..."}
          disabled={sending}
          maxLength={1000}
        />
        
        <button 
          type="submit" 
          disabled={sending || (!newMessage.trim() && !selectedFile)}
          className={sending ? 'sending' : ''}
          title="Gửi"
        >
          {uploading ? '📤' : sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
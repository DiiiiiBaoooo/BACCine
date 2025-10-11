import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../backend/config/firebase';

function ConversationList({ conversations, selectedConversation, onSelectConversation, currentUserId }) {
  const [conversationsWithLastMsg, setConversationsWithLastMsg] = useState([]);

  useEffect(() => {
    if (!conversations || conversations.length === 0) {
      setConversationsWithLastMsg([]);
      return;
    }

    const unsubscribes = conversations.map((conv) => {
      const messagesRef = ref(database, `messages/${conv.id}`);

      return onValue(messagesRef, (snapshot) => {
        let lastMessage = null;
        let unreadCount = 0;

        snapshot.forEach((childSnapshot) => {
          const msg = childSnapshot.val();
          lastMessage = msg;
          if (!msg.read && msg.sender_id !== currentUserId) {
            unreadCount++;
          }
        });

        setConversationsWithLastMsg((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((c) => c.id === conv.id);

          const convData = {
            ...conv,
            lastMessage: lastMessage?.content || 'Chưa có tin nhắn',
            lastMessageTime: lastMessage?.timestamp,
            unreadCount,
          };

          if (index >= 0) {
            updated[index] = convData;
          } else {
            updated.push(convData);
          }

          return updated; // Không cần sắp xếp, vì conversations từ ChatWidget đã đúng thứ tự
        });
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [conversations, currentUserId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="conversation-list overflow-y-hidden">
      {conversationsWithLastMsg.length === 0 ? (
        <div className="empty-conversations">
          <p>Chưa có cuộc hội thoại nào</p>
        </div>
      ) : (
        conversationsWithLastMsg.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv)}
          >
            <div className="conversation-avatar">
              <span>👤</span>
            </div>
            <div className="conversation-details">
              <div className="conversation-header">
                <span className="conversation-name">
                  Khách hàng 
                </span>
                <span className="conversation-time">
                  {formatTime(conv.lastMessageTime)}
                </span>
              </div>
              <div className="conversation-preview">
                <span className="last-message">{conv.lastMessage}</span>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ConversationList;
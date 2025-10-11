// src/services/chat.service.js
import { database } from '../config/firebase.js'
import { 
  ref, 
  push, 
  set, 
  onValue, 
  query, 
  orderByChild,
  serverTimestamp,
  get,
  update,
  off
} from 'firebase/database';

class ChatService {
  /**
   * Tạo cuộc hội thoại mới giữa khách hàng và nhân viên
   */
  async createConversation(customerId, employeeId, cinemaId = null) {
    try {
      const conversationRef = push(ref(database, 'conversations'));
      const conversationId = conversationRef.key;

      const conversationData = {
        customer_id: customerId,
        employee_id: employeeId,
        cinema_id: cinemaId,
        created_at: serverTimestamp(),
        last_message_at: serverTimestamp(),
        status: 'active'
      };

      await set(conversationRef, conversationData);

      // Lưu mapping user -> conversation
      await set(
        ref(database, `user_conversations/customer_${customerId}/${conversationId}`), 
        true
      );
      await set(
        ref(database, `user_conversations/employee_${employeeId}/${conversationId}`), 
        true
      );

      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage(conversationId, senderId, senderType, content) {
    try {
      const messageRef = push(ref(database, `messages/${conversationId}`));
      
      const messageData = {
        sender_id: senderId,
        sender_type: senderType, // 'customer' hoặc 'employee'
        content: content.trim(),
        timestamp: serverTimestamp(),
        read: false
      };

      await set(messageRef, messageData);

      // Cập nhật last_message_at của conversation
      await update(ref(database, `conversations/${conversationId}`), {
        last_message_at: serverTimestamp(),
        last_message: content.trim().substring(0, 100)
      });

      return messageRef.key;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Lắng nghe tin nhắn mới realtime
   * @returns function để unsubscribe
   */
  listenToMessages(conversationId, callback) {
    const messagesRef = query(
      ref(database, `messages/${conversationId}`),
      orderByChild('timestamp')
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(messages);
    });

    // Return unsubscribe function
    return () => off(messagesRef);
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markAsRead(conversationId, messageId) {
    try {
      await update(
        ref(database, `messages/${conversationId}/${messageId}`), 
        { read: true }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Đánh dấu tất cả tin nhắn trong conversation đã đọc
   */
  async markAllAsRead(conversationId, currentUserId) {
    try {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          // Chỉ đánh dấu đã đọc tin nhắn của người khác gửi
          if (message.sender_id !== currentUserId && !message.read) {
            updates[`${childSnapshot.key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(messagesRef, updates);
        }
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   */
  async getUnreadCount(conversationId, currentUserId) {
    try {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const snapshot = await get(messagesRef);
      
      let unreadCount = 0;
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (message.sender_id !== currentUserId && !message.read) {
            unreadCount++;
          }
        });
      }
      
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Lấy danh sách cuộc hội thoại của user
   */
  async getUserConversations(userId, userType) {
    try {
      const userConvRef = ref(database, `user_conversations/${userType}_${userId}`);
      const snapshot = await get(userConvRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const conversationIds = Object.keys(snapshot.val());
      const conversations = [];

      // Lấy chi tiết từng conversation
      for (const convId of conversationIds) {
        const convSnapshot = await get(ref(database, `conversations/${convId}`));
        if (convSnapshot.exists()) {
          conversations.push({
            id: convId,
            ...convSnapshot.val()
          });
        }
      }

      // Sắp xếp theo thời gian tin nhắn cuối cùng
      conversations.sort((a, b) => {
        const timeA = a.last_message_at || 0;
        const timeB = b.last_message_at || 0;
        return timeB - timeA;
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Lắng nghe danh sách conversations realtime
   */
  listenToConversations(userId, userType, callback) {
    const userConvRef = ref(database, `user_conversations/${userType}_${userId}`);
    
    const unsubscribe = onValue(userConvRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const conversationIds = Object.keys(snapshot.val());
      const conversations = [];

      for (const convId of conversationIds) {
        const convSnapshot = await get(ref(database, `conversations/${convId}`));
        if (convSnapshot.exists()) {
          conversations.push({
            id: convId,
            ...convSnapshot.val()
          });
        }
      }

      // Sắp xếp theo thời gian
      conversations.sort((a, b) => {
        const timeA = a.last_message_at || 0;
        const timeB = b.last_message_at || 0;
        return timeB - timeA;
      });

      callback(conversations);
    });

    return () => off(userConvRef);
  }

  /**
   * Cập nhật trạng thái conversation
   */
  async updateConversationStatus(conversationId, status) {
    try {
      await update(ref(database, `conversations/${conversationId}`), {
        status: status // 'active', 'closed', 'resolved'
      });
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }

  /**
   * Xóa conversation (soft delete)
   */
  async deleteConversation(conversationId) {
    try {
      await update(ref(database, `conversations/${conversationId}`), {
        status: 'deleted',
        deleted_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export default new ChatService();
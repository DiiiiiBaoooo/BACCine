// backend/services/chat.service.js
import { ref, push, set, onValue, query, orderByChild, get, update, serverTimestamp } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../config/firebase';

class ChatService {
  // Tạo conversation mới
  async createConversation(customerId, employeeId, cinemaId = null) {
    try {
      console.log('📝 Creating conversation:', { customerId, employeeId, cinemaId });

      const conversationsRef = ref(database, 'conversations');
      const newConvRef = push(conversationsRef);
      const conversationId = newConvRef.key;

      const conversationData = {
        id: conversationId,
        customer_id: String(customerId),
        employee_id: String(employeeId),
        cinema_id: cinemaId ? String(cinemaId) : null,
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      // ✅ Sử dụng set() để tạo conversation node
      await set(newConvRef, conversationData);
      console.log('✅ Conversation created:', conversationId);

      // ✅ Tạo reference cho customer
      await set(ref(database, `user_conversations/customer_${customerId}/${conversationId}`), {
        conversation_id: conversationId,
        customer_id: String(customerId),
        employee_id: String(employeeId),
        cinema_id: cinemaId ? String(cinemaId) : null,
        status: 'active',
        other_user_id: String(employeeId),
        other_user_type: 'employee',
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      console.log('✅ Customer reference created');

      // ✅ Tạo reference cho employee
      await set(ref(database, `user_conversations/employee_${employeeId}/${conversationId}`), {
        conversation_id: conversationId,
        customer_id: String(customerId),
        employee_id: String(employeeId),
        cinema_id: cinemaId ? String(cinemaId) : null,
        status: 'active',
        other_user_id: String(customerId),
        other_user_type: 'customer',
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      console.log('✅ Employee reference created');

      // ✅ Khởi tạo unread count (optional, nhưng nên có)
      await set(ref(database, `unread_count/${conversationId}/customer_${customerId}`), 0);
      await set(ref(database, `unread_count/${conversationId}/employee_${employeeId}`), 0);
      console.log('✅ Unread count initialized');

      return conversationId;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  }

  // Upload file lên Firebase Storage
  async uploadFile(file, conversationId) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `chat_files/${conversationId}/${fileName}`);
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: timestamp.toString(),
        }
      };

      const snapshot = await uploadBytes(fileRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        name: file.name,
        type: file.type,
        size: file.size,
        path: snapshot.ref.fullPath,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Gửi tin nhắn (text hoặc file)
  async sendMessage(conversationId, senderId, senderType, content, fileData = null) {
    try {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const newMessageRef = push(messagesRef);
      
      const messageData = {
        id: newMessageRef.key,
        sender_id: String(senderId),
        sender_type: senderType,
        content: content || '',
        timestamp: Date.now(),
        read: false,
      };

      // Nếu có file đính kèm
      if (fileData) {
        messageData.file = {
          url: fileData.url,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
        };
        messageData.message_type = this.getMessageType(fileData.type);
      } else {
        messageData.message_type = 'text';
      }

      // ✅ Sử dụng set() để tạo message
      await set(newMessageRef, messageData);
      console.log('✅ Message sent:', newMessageRef.key);

      // ✅ Cập nhật conversation
      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        last_message: content || `[${messageData.message_type}]`,
        last_message_time: Date.now(),
        updated_at: Date.now(),
      });

      // ✅ Cập nhật user_conversations cho cả 2 users
      const conversationSnapshot = await get(conversationRef);
      const conversationData = conversationSnapshot.val();

      if (conversationData) {
        const { customer_id, employee_id } = conversationData;

        // Cập nhật cho customer
        await update(
          ref(database, `user_conversations/customer_${customer_id}/${conversationId}`),
          {
            last_message: content || `[${messageData.message_type}]`,
            last_message_time: Date.now(),
            updated_at: Date.now(),
          }
        );

        // Cập nhật cho employee
        await update(
          ref(database, `user_conversations/employee_${employee_id}/${conversationId}`),
          {
            last_message: content || `[${messageData.message_type}]`,
            last_message_time: Date.now(),
            updated_at: Date.now(),
          }
        );

        // ✅ Tăng unread count cho người nhận
        const receiverType = senderType === 'customer' ? 'employee' : 'customer';
        const receiverId = senderType === 'customer' ? employee_id : customer_id;
        
        const unreadRef = ref(database, `unread_count/${conversationId}/${receiverType}_${receiverId}`);
        const unreadSnapshot = await get(unreadRef);
        const currentUnread = unreadSnapshot.val() || 0;
        await set(unreadRef, currentUnread + 1);
        console.log(`✅ Unread count updated for ${receiverType}_${receiverId}: ${currentUnread + 1}`);
      }

      return messageData;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Xác định loại tin nhắn dựa trên MIME type
  getMessageType(mimeType) {
    if (!mimeType) return 'file';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    return 'file';
  }

  // Lắng nghe tin nhắn realtime
  listenToMessages(conversationId, callback) {
    const messagesRef = ref(database, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    return onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      callback(messages);
    });
  }

  // Đánh dấu tất cả tin nhắn là đã đọc
  async markAllAsRead(conversationId, currentUserId) {
    try {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const snapshot = await get(messagesRef);

      const updates = {};
      snapshot.forEach((childSnapshot) => {
        const msg = childSnapshot.val();
        if (msg.sender_id !== String(currentUserId) && !msg.read) {
          updates[`${childSnapshot.key}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(messagesRef, updates);
        console.log(`✅ Marked ${Object.keys(updates).length} messages as read`);
      }

      // ✅ Reset unread count
      const conversationSnapshot = await get(ref(database, `conversations/${conversationId}`));
      const conversationData = conversationSnapshot.val();

      if (conversationData) {
        const { customer_id, employee_id } = conversationData;
        
        // Xác định user type và reset unread count
        if (String(currentUserId) === customer_id) {
          await set(ref(database, `unread_count/${conversationId}/customer_${currentUserId}`), 0);
        } else if (String(currentUserId) === employee_id) {
          await set(ref(database, `unread_count/${conversationId}/employee_${currentUserId}`), 0);
        }
        console.log('✅ Unread count reset');
      }
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  // Lấy số tin nhắn chưa đọc
  async getUnreadCount(conversationId, currentUserId) {
    try {
      // ✅ Thử cả 2 loại user
      const customerUnreadRef = ref(database, `unread_count/${conversationId}/customer_${currentUserId}`);
      const employeeUnreadRef = ref(database, `unread_count/${conversationId}/employee_${currentUserId}`);
      
      const customerSnapshot = await get(customerUnreadRef);
      const employeeSnapshot = await get(employeeUnreadRef);
      
      const customerUnread = customerSnapshot.val() || 0;
      const employeeUnread = employeeSnapshot.val() || 0;
      
      const count = Math.max(customerUnread, employeeUnread);
      console.log(`📊 Unread count for user ${currentUserId} in conversation ${conversationId}:`, count);
      
      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  // ✨ THÊM: Lấy conversation details
  async getConversation(conversationId) {
    try {
      const conversationRef = ref(database, `conversations/${conversationId}`);
      const snapshot = await get(conversationRef);
      
      if (snapshot.exists()) {
        return {
          id: conversationId,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return null;
    }
  }

  // ✨ THÊM: Đóng conversation
  async closeConversation(conversationId) {
    try {
      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        status: 'closed',
        closed_at: Date.now(),
        updated_at: Date.now(),
      });
      console.log('✅ Conversation closed:', conversationId);
    } catch (error) {
      console.error('❌ Error closing conversation:', error);
      throw error;
    }
  }
}

export default new ChatService();
// backend/services/chat.service.js
import { ref, push, set, onValue, query, orderByChild, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../config/firebase';

class ChatService {
  // Tạo conversation mới
  async createConversation(customerId, employeeId, cinemaId = null) {
    try {
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

      await set(newConvRef, conversationData);

      await set(ref(database, `user_conversations/customer_${customerId}/${conversationId}`), {
        ...conversationData,
        other_user_id: String(employeeId),
        other_user_type: 'employee',
      });

      await set(ref(database, `user_conversations/employee_${employeeId}/${conversationId}`), {
        ...conversationData,
        other_user_id: String(customerId),
        other_user_type: 'customer',
      });

      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
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

      await set(newMessageRef, messageData);

      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        last_message: content || `[${messageData.message_type}]`,
        last_message_time: Date.now(),
        updated_at: Date.now(),
      });

      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Xác định loại tin nhắn dựa trên MIME type
  getMessageType(mimeType) {
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
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Lấy số tin nhắn chưa đọc
  async getUnreadCount(conversationId, currentUserId) {
    try {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const snapshot = await get(messagesRef);

      let count = 0;
      snapshot.forEach((childSnapshot) => {
        const msg = childSnapshot.val();
        if (msg.sender_id !== String(currentUserId) && !msg.read) {
          count++;
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export default new ChatService();
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../backend/config/firebase';
import ChatService from '../../../../backend/services/chat.service';
import ChatBox from './ChatBox';
import ConversationList from './ConversationList';
import useAuthUser from '../../hooks/useAuthUser';
import axios from 'axios';

function ChatWidget({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineEmployees, setOnlineEmployees] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false); // ✨ THÊM state mới

  // Load online employees
  useEffect(() => {
    const fetchOnlineEmployees = async () => {
      try {
        const response = await axios.get('/api/employee/online');
        const data = response.data.employees || [];
        setOnlineEmployees(data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách employee online:', error);
      }
    };

    fetchOnlineEmployees();
    const interval = setInterval(fetchOnlineEmployees, 30000);

    return () => clearInterval(interval);
  }, []);

  // Lắng nghe conversations realtime
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🔄 Lắng nghe conversations realtime...');
    const conversationsRef = ref(database, `user_conversations/${currentUser.type}_${currentUser.id}`);
    
    const unsubscribe = onValue(conversationsRef, async (snapshot) => {
      try {
        setLoading(true);
        const convData = snapshot.val();
        const convs = convData ? Object.keys(convData).map((key) => ({
          id: key,
          ...convData[key],
        })) : [];

        console.log('✅ Đã tải được conversations:', convs.length);
        setConversations(convs);
      } catch (error) {
        console.error('❌ Lỗi khi tải cuộc hội thoại:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✨ THÊM: Lắng nghe tin nhắn realtime để cập nhật unread count
  useEffect(() => {
    if (!currentUser?.id || conversations.length === 0) {
      setUnreadCount(0);
      return;
    }

    console.log('🔔 Bắt đầu lắng nghe tin nhắn realtime cho tất cả conversations...');
    const unsubscribers = [];

    // Lắng nghe messages cho từng conversation
    conversations.forEach((conv) => {
      const messagesRef = ref(database, `messages/${conv.id}`);
      
      const unsubscribe = onValue(messagesRef, async () => {
        // Mỗi khi có tin nhắn mới, tính lại unread count
        try {
          const unread = await ChatService.getUnreadCount(conv.id, currentUser.id);
          
          // Cập nhật unread count cho conversation này
          setConversations(prevConvs => 
            prevConvs.map(c => 
              c.id === conv.id ? { ...c, unreadCount: unread } : c
            )
          );
        } catch (error) {
          console.error('❌ Lỗi khi lấy unread count:', error);
        }
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      console.log('🧹 Cleanup message listeners...');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [conversations.length, currentUser.id]); // Chạy lại khi số lượng conversations thay đổi

  // Tính tổng unread count từ tất cả conversations
  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    setUnreadCount(total);
    console.log('📊 Tổng unread count:', total);
  }, [conversations]);

  // Tạo cuộc hội thoại mới
  const startNewConversation = async () => {
    try {
      setIsConnecting(true); // ✨ Bắt đầu connecting
      console.log('📞 Bắt đầu tạo conversation...');
  
      // Kiểm tra conversation với employee online
      let activeConversation = null;
      for (const conv of conversations) {
        const employeeId = conv.employee_id;
        const isEmployeeOnline = onlineEmployees.some(emp => emp.employee_id === employeeId);
        if (isEmployeeOnline) {
          activeConversation = conv;
          break;
        }
      }
  
      if (activeConversation) {
        console.log('✅ Đã tìm thấy conversation với nhân viên online:', activeConversation);
        setSelectedConversation(activeConversation);
        setIsChatOpen(true);
        return;
      }
  
      console.log('🔍 Không tìm thấy conversation với nhân viên online, tạo mới...');
      const employeeId = await getAvailableEmployee();
  
      const conversationId = await ChatService.createConversation(
        currentUser.id,
        employeeId,
        null
      );
  
      console.log('✅ Conversation đã tạo với ID:', conversationId);
  
      const newConv = {
        id: conversationId,
        customer_id: currentUser.id,
        employee_id: employeeId,
        cinema_id: null,
        status: 'active',
      };
  
      setSelectedConversation(newConv);
      setIsChatOpen(true);
    } catch (error) {
      console.error('❌ Lỗi khi tạo cuộc hội thoại:', error);
      alert('Không thể kết nối với nhân viên. Vui lòng thử lại!');
    } finally {
      setIsConnecting(false); // ✨ Kết thúc connecting
    }
  };

  const getAvailableEmployee = async () => {
    try {
      console.log('🔍 Tìm employee online...');
      const response = await axios.get('/api/employee/online');
      const employees = response.data.employees;

      if (!employees || employees.length === 0) {
        throw new Error('Hiện không có nhân viên nào đang online');
      }

      const selectedEmployee = employees[Math.floor(Math.random() * employees.length)];
      console.log('✅ Employee online được chọn:', selectedEmployee);
      return String(selectedEmployee.employee_id);
    } catch (error) {
      console.error('❌ Lỗi khi tìm employee:', error);
      console.warn('⚠️ Dùng mock employee ID');
      return '10';
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <button
        className="chat-fab"
        onClick={toggleChat}
        title={currentUser.type === 'customer' ? 'Chat với nhân viên' : 'Hỗ trợ khách hàng'}
      >
        💬
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isChatOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <h3>{currentUser.type === 'customer' ? '💬 Chat với nhân viên' : '💼 Hỗ trợ khách hàng'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentUser.type === 'customer' && onlineEmployees.length > 0 && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#4ade80',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                  ></span>
                  {onlineEmployees.length} nhân viên đang online
                </span>
              )}
              <button onClick={handleCloseChat} className="close-btn">
                ✕
              </button>
            </div>
          </div>

          <div className="chat-panel-body">
            {currentUser.type === 'employee' && (
              <div className="conversations-sidebar">
                <h4>Cuộc hội thoại ({conversations.length})</h4>
                {loading ? (
                  <div className="loading-state">Đang tải...</div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={handleSelectConversation}
                    currentUserId={currentUser.id}
                  />
                )}
              </div>
            )}

            <div className="chat-main">
              {selectedConversation ? (
                <ChatBox
                  conversationId={selectedConversation.id}
                  currentUserId={currentUser.id}
                  currentUserType={currentUser.type}
                  onMessageSent={() => {
                    console.log('Tin nhắn mới gửi, conversations sẽ tự cập nhật realtime');
                  }}
                />
              ) : (
                <div className="chat-empty">
                  {currentUser.type === 'customer' ? (
                    <div className="empty-content">
                      <div className="empty-icon">💬</div>
                      <p className="empty-title">Chào mừng bạn đến với hỗ trợ khách hàng!</p>
                      <p className="empty-subtitle">Chúng tôi sẵn sàng giúp bạn mọi lúc</p>
                      <button
                        className="btn-start-chat"
                        onClick={startNewConversation}
                        disabled={isConnecting} // ✨ Sử dụng isConnecting
                      >
                        {isConnecting ? 'Đang kết nối...' : 'Bắt đầu trò chuyện'} {/* ✨ Chỉ hiện "Đang kết nối..." */}
                      </button>
                    </div>
                  ) : (
                    <div className="empty-content">
                      <div className="empty-icon">📭</div>
                      <p className="empty-title">Chưa có cuộc trò chuyện nào</p>
                      <p className="empty-subtitle">Bạn sẽ nhận thông báo khi có khách hàng liên hệ</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
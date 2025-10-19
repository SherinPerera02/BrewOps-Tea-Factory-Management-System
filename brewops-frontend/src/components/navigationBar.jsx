import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Bell, MessageSquare, X, LogOut, Search, Send, CheckCheck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ProfileModal from './ProfileModal';
import './navigationBar.css';
import '../styles/responsive.css';

// Keep a singleton socket instance to avoid rapid create/destroy cycles
// (React StrictMode in development can mount/unmount components twice).
let socketInstance = null;
let socketHandlersAttached = false;

const NavigationBar = ({ onMenuClick }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchNotifications();
    fetchMessages();
    fetchAllUsers();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    // Connect to Socket.IO server with conservative reconnection settings
    // Reuse singleton socket to avoid close-before-open
    if (!socketInstance) {
      try {
        socketInstance = io('http://localhost:5000', {
          transports: ['websocket'],
          reconnectionAttempts: 3,
          reconnectionDelayMax: 5000,
          timeout: 5000,
          auth: {
            token: localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')
          }
        });
      } catch (err) {
        console.warn('Socket.IO server not available:', err.message);
      }
    }

    // Attach diagnostic handlers once
    if (socketInstance && !socketHandlersAttached) {
      socketHandlersAttached = true;
      socketInstance.on('connect', () => {
        console.info('Socket connected, id=', socketInstance.id);
      });

      socketInstance.on('connect_error', (err) => {
        // Silently handle connection errors - Socket.IO server may not be running
        console.debug('Socket.IO connection unavailable (this is normal if server is not running)');
      });

      socketInstance.on('connect_timeout', (timeout) => {
        console.debug('Socket connection timeout:', timeout);
      });

      socketInstance.on('reconnect_attempt', (attempt) => {
        console.warn('Socket reconnect_attempt:', attempt);
      });

      socketInstance.on('reconnect_failed', () => {
        console.error('Socket reconnect_failed');
      });

      socketInstance.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error event:', err);
      });
    }

    // Listen for notification events
    const onNotification = (notif) => {
      if (notif && notif.id) {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadNotifications((prev) => prev + 1);
        toast.success(notif.title || 'New notification', {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        console.warn('Received notification without valid ID:', notif);
      }
    };

    // Listen for message events
    const onMessage = (msg) => {
      if (msg && msg.id) {
        setMessages((prev) => [msg, ...prev]);
        setUnreadMessages((prev) => prev + 1);
      } else {
        console.warn('Received message without valid ID:', msg);
      }
    };

    if (socketInstance) {
      socketInstance.on('notification', onNotification);
      socketInstance.on('message', onMessage);
    }

    // Clean up listeners on unmount (remove handlers but keep singleton socket alive)
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      if (socketInstance) {
        socketInstance.off('notification', onNotification);
        socketInstance.off('message', onMessage);
      }
    };
  }, []);


  useEffect(() => {
    // Filter users based on search query
    if (!Array.isArray(allUsers)) {
      setFilteredUsers([]);
      return;
    }
    if (searchQuery.trim() === '') {
      setFilteredUsers([]);
    } else {
      const filtered = allUsers.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Keep a body-level class to indicate off-canvas sidebar is open (used by responsive.css)
  useEffect(() => {
    if (sidebarOpen) document.body.classList.add('app-with-sidebar-open');
    else document.body.classList.remove('app-with-sidebar-open');
    return () => document.body.classList.remove('app-with-sidebar-open');
  }, [sidebarOpen]);

  const fetchUserProfile = async () => {
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      
      // First try to get user info from storage
      const storedUserInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const userInfo = JSON.parse(storedUserInfo);
          setUser(userInfo);
        } catch (e) {
          console.error('Error parsing stored user info:', e);
        }
      }
      
      // Require token for profile requests
      if (!token) {
        console.log('No JWT token found, user not logged in');
        setUser(null);
        return;
      }
      
      const res = await axios.get('http://localhost:5000/api/auth/profile', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Adjust for backend response structure
      if (res.data && res.data.success && res.data.data) {
        setUser(res.data.data);
        
        // Update stored user info with fresh data from backend
        const userInfo = {
          name: res.data.data.name,
          role: res.data.data.role,
          email: res.data.data.email,
          id: res.data.data.id
        };
        
        if (localStorage.getItem('jwtToken')) {
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } else if (sessionStorage.getItem('jwtToken')) {
          sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token is invalid or expired, clear it
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('userInfo');
      }
      setUser(null);
    }
  };

  const fetchNotifications = async () => {
  // simple rate-limit guard: avoid calling more than once every 10s
  if (fetchNotifications._lastCalled && Date.now() - fetchNotifications._lastCalled < 10000) return;
  fetchNotifications._lastCalled = Date.now();
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let notificationData = [];
      if (Array.isArray(res.data)) {
        notificationData = res.data;
      } else if (res.data && Array.isArray(res.data.notifications)) {
        notificationData = res.data.notifications;
      }
      
      setNotifications(notificationData);
      setUnreadNotifications(notificationData.filter(n => !n.read).length);
      
      // Show toast for new notifications
      const newNotifications = notificationData.filter(n => !n.read && n.isNew);
      newNotifications.forEach(notif => {
        toast.success(notif.title || 'New notification', {
          duration: 4000,
          position: 'top-right',
        });
      });
      
    } catch (error) {
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  const fetchMessages = async () => {
  if (fetchMessages._lastCalled && Date.now() - fetchMessages._lastCalled < 10000) return;
  fetchMessages._lastCalled = Date.now();
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get('http://localhost:5000/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let messageData = [];
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        messageData = res.data.data;
      } else if (Array.isArray(res.data)) {
        messageData = res.data;
      }
      
      setMessages(messageData);
      setUnreadMessages(messageData.filter(m => m.unread).length);
      
    } catch (error) {
      setMessages([]);
      setUnreadMessages(0);
    }
  };

  const fetchAllUsers = async () => {
  if (fetchAllUsers._lastCalled && Date.now() - fetchAllUsers._lastCalled < 10000) return;
  fetchAllUsers._lastCalled = Date.now();
    try {
      const token = localStorage.getItem('jwtToken');
      // Use a wildcard search to get all users
      const res = await axios.get('http://localhost:5000/api/messages/search-users?query=a', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let userData = [];
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        userData = res.data.data;
      } else if (Array.isArray(res.data)) {
        userData = res.data;
      }
      
      setAllUsers(userData);
    } catch (error) {
      setAllUsers([]);
    }
  };

  const fetchChatHistory = async (userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get(`http://localhost:5000/api/messages/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let chatData = [];
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        chatData = res.data.data;
      } else if (Array.isArray(res.data)) {
        chatData = res.data;
      }
      
      setChatHistory(chatData);
    } catch (error) {
      setChatHistory([]);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // Check if notificationId is valid
      if (!notificationId) {
        console.error('Cannot mark notification as read: Invalid ID');
        return;
      }
      
      const token = localStorage.getItem('jwtToken');
      await axios.patch(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state instead of refetching
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      // Check if messageId is valid
      if (!messageId) {
        console.error('Cannot mark message as read: Invalid ID');
        return;
      }
      
      const token = localStorage.getItem('jwtToken');
      await axios.patch(`http://localhost:5000/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state instead of refetching
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      setUnreadMessages(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;

    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.post('http://localhost:5000/api/messages/send', {
        receiverId: selectedUser.id,
        message: messageText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessageText('');
      fetchChatHistory(selectedUser.id);
      fetchMessages();
      
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Message sent successfully!');
      } else {
        toast.success('Message sent successfully!');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const closeAllPanels = () => {
    setShowUserPanel(false);
    setShowNotifications(false);
    setShowMessages(false);
    setSelectedUser(null);
    setSearchQuery('');
    setFilteredUsers([]);
  };

  const toggleUserPanel = () => {
    closeAllPanels();
    const wasOpen = showUserPanel;
    setShowUserPanel(!showUserPanel);
    
    // Fetch fresh user data when opening the panel
    if (!wasOpen) {
      fetchUserProfile();
    }
  };

  const toggleNotifications = () => {
    closeAllPanels();
    setShowNotifications(!showNotifications);
  };

  const toggleMessages = () => {
    closeAllPanels();
    setShowMessages(!showMessages);
  };

  const selectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery('');
    setFilteredUsers([]);
    fetchChatHistory(selectedUser.id);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem('userInfo');
    setShowUserPanel(false);
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          {/* Mobile hamburger to open off-canvas sidebar */}
          <button
            className="hamburger-button mobile-only"
            aria-label="Open menu"
            onClick={() => document.body.classList.add('app-with-sidebar-open')}
          >
            <svg className="hamburger-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="brand-title" onClick={() => navigate('/')}>BrewOps</h1>
        </div>
        <div className="navbar-right">
          <button onClick={toggleMessages} className="nav-button">
            <MessageSquare className="nav-icon" />
            {unreadMessages > 0 && (
              <span className="notification-badge">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </button>
          <button onClick={toggleNotifications} className="nav-button">
            <Bell className="nav-icon" />
            {unreadNotifications > 0 && (
              <span className="notification-badge">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>
          <button onClick={toggleUserPanel} className="user-button">
            <div className="user-avatar">
              <User className="user-avatar-icon" />
            </div>
          </button>
        </div>

        {/* Overlay */}
        {(showUserPanel || showNotifications || showMessages) && (
          <div className="overlay" onClick={closeAllPanels} />
        )}

        {/* User Profile Panel */}
        <div className={`side-panel user-panel ${showUserPanel ? 'open' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-content">
              <div className="user-profile">
                <div className="user-profile-avatar">
                  <span className="user-initials">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="user-name">{user?.name || user?.email || 'No Name'}</h3>
                  <p className="user-role">{user?.role || 'No Role'}</p>
                </div>
              </div>
              <button onClick={() => setShowUserPanel(false)} className="close-button">
                <X className="close-icon" />
              </button>
            </div>
          </div>
          <div className="panel-content">
            <div className="menu-items">
              <button className="menu-item" onClick={() => setShowProfileModal(true)}> 
                <User className="menu-icon" /> 
                <span>Profile</span> 
              </button>
              <hr className="menu-divider" />
              <button className="menu-item logout" onClick={handleLogout}> 
                <LogOut className="menu-icon" /> 
                <span>Log out</span> 
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className={`side-panel notifications-panel ${showNotifications ? 'open' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-content">
              <h3 className="panel-title">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="close-button">
                <X className="close-icon" />
              </button>
            </div>
          </div>
          <div className="panel-content">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications</div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={idx} 
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => markNotificationAsRead(notif.id)}
                >
                  <div className="notification-icon">
                    <div className={`notification-icon-wrapper ${
                      notif.read ? 'read' : 'unread'
                    }`}>
                      <Bell className="notification-bell-icon" />
                    </div>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notif.title || 'Notification'}
                    </div>
                    <div className="notification-message">
                      {notif.body || ''}
                    </div>
                    <div className="notification-time">{notif.time || ''}</div>
                  </div>
                  {!notif.read && (
                    <div className="notification-unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className={`side-panel messages-panel ${showMessages ? 'open' : ''}`}>
          {!selectedUser ? (
            // User Search and List View
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Messages</h3>
                  <button onClick={() => setShowMessages(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {/* Search Results */}
                {filteredUsers.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Search Results</h4>
                    <div className="space-y-2">
                      {filteredUsers.map((searchUser) => (
                        <div
                          key={searchUser.id}
                          className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => selectUser(searchUser)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                              {getInitials(searchUser.name)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{searchUser.name}</p>
                              <p className="text-xs text-gray-600">{searchUser.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recent Messages */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Messages</h4>
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No messages</div>
                    ) : (
                      messages.map((msg, idx) => {
                        // Use the backend's "otherPerson" fields for conversation display
                        const displayName = msg.otherPersonName || 'Unknown';
                        const displayInitials = msg.otherPersonInitials || getInitials(displayName);
                        const partnerId = msg.otherPersonId;
                        const partnerRole = msg.otherPersonRole;

                        return (
                          <div
                            key={idx}
                            className={`p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${
                              msg.unread ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                            onClick={() => {
                              selectUser({ id: partnerId, name: displayName, role: partnerRole });
                              if (msg.unread) {
                                markMessageAsRead(msg.id);
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                                {displayInitials}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{displayName}</p>
                                <p className="text-xs text-gray-600 truncate">{msg.body || ''}</p>
                                <p className="text-xs text-gray-500 mt-1">{msg.time || ''}</p>
                              </div>
                              {msg.unread && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Chat View
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(selectedUser.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{selectedUser.name}</h3>
                      <p className="text-xs text-gray-600">{selectedUser.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMessages(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      chat.senderId === user?.id 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{chat.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          chat.senderId === user?.id ? 'text-green-200' : 'text-gray-500'
                        }`}>
                          {chat.time}
                        </p>
                        {chat.senderId === user?.id && (
                          <div className="ml-2">
                            {chat.read ? (
                              <CheckCheck className="w-3 h-3 text-green-200" />
                            ) : (
                              <Check className="w-3 h-3 text-green-200" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
};

export default NavigationBar;
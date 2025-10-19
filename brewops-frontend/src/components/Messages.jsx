import React, { useState, useEffect } from 'react';
import './Messages.css';

const Messages = ({ userRole, userId }) => {
  const [messages, setMessages] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiver_id: '',
    subject: '',
    message: ''
  });
  const [sendToAllSuppliers, setSendToAllSuppliers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    if (userRole === 'manager') {
      fetchSuppliers();
    } else if (userRole === 'supplier') {
      fetchManagers();
    }
  }, [userId, userRole]);

  const fetchMessages = async () => {
    try {
      // For suppliers, only fetch messages they received (by receiver_id)
      // For other roles, fetch all messages (sent and received)
      const endpoint = userRole === 'supplier' 
        ? `/api/messages/received/${userId}` 
        : `/api/messages/${userId}`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/manager/suppliers');
      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (sendToAllSuppliers) {
        response = await fetch('/api/messages/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: userId, subject: newMessage.subject, message: newMessage.message })
        });
      } else {
        response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: userId,
            ...newMessage
          }),
        });
      }

      if (response.ok) {
        setShowComposeModal(false);
        setNewMessage({ receiver_id: '', subject: '', message: '' });
        fetchMessages(); // Refresh messages
        alert('Message sent successfully!');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
      });
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.receiver_id === parseInt(userId)) {
      markAsRead(message.id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>Messages</h2>
        {userRole === 'manager' && (
          <button 
            className="compose-btn"
            onClick={() => setShowComposeModal(true)}
          >
            Compose Message
          </button>
        )}
      </div>

      <div className="messages-content">
        <div className="messages-list">
          <h3>All Messages</h3>
          {messages.length === 0 ? (
            <p className="no-messages">No messages found</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message-item ${!message.is_read && message.receiver_id === parseInt(userId) ? 'unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-header">
                  <span className="message-subject">{message.subject}</span>
                  <span className="message-date">{formatDate(message.created_at)}</span>
                </div>
                <div className="message-info">
                  <span className="message-participants">
                    {message.sender_id === parseInt(userId) 
                      ? `To: ${message.receiver_name}` 
                      : `From: ${message.sender_role === 'manager' ? 'Production Manager' : message.sender_name}`}
                  </span>
                  {!message.is_read && message.receiver_id === parseInt(userId) && (
                    <span className="unread-indicator">●</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="message-detail-header">
              <h3>{selectedMessage.subject}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedMessage(null)}
              >
                ×
              </button>
            </div>
            <div className="message-detail-info">
              <p><strong>From:</strong> {selectedMessage.sender_role === 'manager' ? 'Production Manager' : selectedMessage.sender_name} ({selectedMessage.sender_role})</p>
              <p><strong>To:</strong> {selectedMessage.receiver_name} ({selectedMessage.receiver_role})</p>
              <p><strong>Date:</strong> {formatDate(selectedMessage.created_at)}</p>
            </div>
            <div className="message-detail-content">
              <p>{selectedMessage.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Compose Message</h3>
              <button 
                className="close-btn"
                onClick={() => setShowComposeModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>To:</label>
                {userRole === 'manager' && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={sendToAllSuppliers} onChange={(e) => setSendToAllSuppliers(e.target.checked)} />
                      <span>Send to all suppliers</span>
                    </label>
                    {!sendToAllSuppliers && (
                      <select
                        value={newMessage.receiver_id}
                        onChange={(e) => setNewMessage({...newMessage, receiver_id: e.target.value})}
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {userRole !== 'manager' && (
                  <select
                    value={newMessage.receiver_id}
                    onChange={(e) => setNewMessage({...newMessage, receiver_id: e.target.value})}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  rows="6"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowComposeModal(false)}>
                  Cancel
                </button>
                <button type="submit">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
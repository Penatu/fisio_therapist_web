import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext(undefined);

const MOCK_CHAT_ROOMS = [
  {
    id: 'chat-1',
    bookingId: '1',
    patientId: 'patient-1',
    patientName: 'Andi Wijaya',
    patientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    lastMessage: 'Baik, sampai nanti jam 2',
    lastMessageTime: '14:25',
    unreadCount: 0,
    status: 'processing',
  },
];

export function ChatProvider({ children }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState(new Map());

  useEffect(() => {
    const storedRooms = localStorage.getItem('chatRooms');
    if (storedRooms) {
      setChatRooms(JSON.parse(storedRooms));
    } else {
      setChatRooms(MOCK_CHAT_ROOMS);
      localStorage.setItem('chatRooms', JSON.stringify(MOCK_CHAT_ROOMS));
    }

    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      setMessages(new Map(JSON.parse(storedMessages)));
    }
  }, []);

  const getChatRoom = (id) => {
    return chatRooms.find((room) => room.id === id);
  };

  const getMessages = (chatRoomId) => {
    return messages.get(chatRoomId) || [];
  };

  const addMessage = (chatRoomId, message) => {
    const roomMessages = messages.get(chatRoomId) || [];
    const newMessage = {
      ...message,
      id: Date.now().toString(),
    };

    const updated = new Map(messages);
    updated.set(chatRoomId, [...roomMessages, newMessage]);
    setMessages(updated);

    localStorage.setItem('chatMessages', JSON.stringify(Array.from(updated.entries())));

    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    updateChatRoom(chatRoomId, {
      lastMessage: message.message,
      lastMessageTime: timeString,
    });
  };

  const updateChatRoom = (id, data) => {
    const updated = chatRooms.map((room) => (room.id === id ? { ...room, ...data } : room));
    setChatRooms(updated);
    localStorage.setItem('chatRooms', JSON.stringify(updated));
  };

  const createChatRoom = (room) => {
    const updated = [...chatRooms, room];
    setChatRooms(updated);
    localStorage.setItem('chatRooms', JSON.stringify(updated));
    messages.set(room.id, []);
  };

  return (
    <ChatContext.Provider
      value={{
        chatRooms,
        getChatRoom,
        getMessages,
        addMessage,
        updateChatRoom,
        createChatRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat harus digunakan dalam ChatProvider');
  }
  return context;
}

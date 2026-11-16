import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext(undefined);

export function ChatProvider({ children }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState(new Map());

  useEffect(() => {
    const storedRooms = localStorage.getItem('chatRooms');
    if (storedRooms) {
      try {
        const rooms = JSON.parse(storedRooms);
        if (Array.isArray(rooms)) setChatRooms(rooms);
      } catch {
        setChatRooms([]);
      }
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

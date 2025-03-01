// pages/chat.tsx
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import UserSync from "../components/UserSync";
import {
  fetchChats,
  createChat,
  addMessageToChat,
  fetchMessagesForChat,
  deleteChatWithMessages,
} from "../lib/chatService";
import { nanoid } from "nanoid";

interface Model {
  id: string;
  name: string;
}

export default function Chatbot() {
  // Clerk auth
  const { user, isSignedIn } = useUser();

  // Sidebar & Chat states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>({
    id: "deepseek-r1-distill-llama-70b",
    name: "DEEPSEEK R1(REASONING)",
  });

  const models: Model[] = [
    { id: "llama-3.3-70b-versatile", name: "LLAMA 3.3" },
    { id: "gemma2-9b-it", name: "GOOGLE GEMMA 2" },
    { id: "deepseek-r1-distill-llama-70b", name: "DEEPSEEK R1(REASONING)" },
    { id: "llama-3.2-90b-vision-preview", name: "LLAMA 3.2" },
  ];

  // Refresh chats from Firestore (if signed in)
  async function refreshChats() {
    if (isSignedIn && user) {
      const userChats = await fetchChats(user.id);
      setChats(userChats);
    }
  }

  useEffect(() => {
    refreshChats();
  }, [user, isSignedIn]);

  // Load messages when a chat is selected (for signed-in users)
  useEffect(() => {
    async function loadMessages() {
      if (!isSignedIn || !user || !selectedChatId) return;
      const msgs = await fetchMessagesForChat(user.id, selectedChatId);
      setMessages(msgs);
    }
    loadMessages();
  }, [selectedChatId, user, isSignedIn]);

  async function handleSendMessage(text: string) {
    // For guest users (local ephemeral chat)
    if (!isSignedIn || !user) {
      let chatId = selectedChatId;
      if (!chatId) {
        chatId = "guest-" + nanoid(6);
        setSelectedChatId(chatId);
        setChats((prev) => [
          ...prev,
          { id: chatId, title: "New Chat (Guest)", createdAt: new Date().toISOString() },
        ]);
      }
      // Add user message locally
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text, sender: "user", timestamp: new Date() },
      ]);
      // Call your backend API including the session_id (chatId)
      const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: chatId,
          question: text,
          backend: "Groq",
          engine: selectedModel.id,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
      ]);
      return;
    }

    // For signed-in users: store messages in Firestore as well
    let chatId = selectedChatId;
    if (!chatId) {
      chatId = await createChat(user.id);
      setSelectedChatId(chatId);
      await refreshChats();
    }
    // Save the user message in Firestore
    await addMessageToChat(user.id, chatId, text, "user");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: "user", timestamp: new Date() },
    ]);
    // Call your backend API with session_id
    const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: chatId,
        question: text,
        backend: "Groq",
        engine: selectedModel.id,
      }),
    });
    const data = await res.json();
    // Save the bot response in Firestore
    await addMessageToChat(user.id, chatId, data.response, "bot");
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
    ]);
  }

  async function handleDeleteChat(chatId: string) {
    if (!isSignedIn || !user) {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
      return;
    }
    await deleteChatWithMessages(user.id, chatId);
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  function onSelectModel(model: Model) {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      {/* Sync user data to Firestore */}
      <UserSync />
      <Sidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onDeleteChat={handleDeleteChat}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="flex-1 flex flex-col">
        <ChatWindow messages={messages} />
        <MessageInput
          onSend={handleSendMessage}
          models={models}
          selectedModel={selectedModel}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          onSelectModel={onSelectModel}
        />
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import {
  fetchChats,
  createChat,
  addMessageToChat,
  fetchMessagesForChat,
  deleteChatWithMessages
} from "../lib/chatService";

interface Model {
  id: string;
  name: string;
}

export default function Chatbot() {
  const { user } = useUser();

  // Sidebar & Chat states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Messages for the selected chat
  const [messages, setMessages] = useState<any[]>([]);

  // Model selection
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>({
    id: "llama-3.3-70b-versatile",
    name: "llama-3.3-70b-versatile",
  });
  const models: Model[] = [
    { id: "llama-3.3-70b-versatile", name: "llama-3.3-70b-versatile" },
    { id: "gemma2-9b-it", name: "gemma2-9b-it" },
    { id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b" },
    { id: "llama-3.2-90b-vision-preview", name: "llama-3.2-90b-vision-preview" },
  ];

  // 1) Fetch the user’s chats once on mount or user change
  async function refreshChats() {
    if (!user) return;
    const userChats = await fetchChats(user.id);
    setChats(userChats);
  }
  useEffect(() => {
    refreshChats();
  }, [user]);

  // 2) Fetch messages only when chat changes
  useEffect(() => {
    async function loadMessages() {
      if (!user || !selectedChatId) return;
      const msgs = await fetchMessagesForChat(user.id, selectedChatId);
      setMessages(msgs);
    }
    loadMessages();
  }, [selectedChatId, user]);

  // 3) Send a message (no immediate re-fetch)
  async function handleSendMessage(text: string) {
    if (!user) return;

    // Create a chat if none is selected
    let chatId = selectedChatId;
    if (!chatId) {
      chatId = await createChat(user.id);
      setSelectedChatId(chatId);
      // Refresh the chat list so the new chat appears in the sidebar
      await refreshChats();
    }

    // a) Add the user’s message to Firestore
    await addMessageToChat(user.id, chatId, text, "user");
    // b) Immediately update local state (no re-fetch)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: "user", timestamp: new Date() },
    ]);

    // c) Get the bot response from your QnA API
    const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        backend: "Groq",
        engine: selectedModel.id,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });
    const data = await res.json();

    // d) Add the bot’s response to Firestore
    await addMessageToChat(user.id, chatId, data.response, "bot");
    // e) Immediately update local state
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
    ]);
  }

  // 4) Delete chat + messages
  async function handleDeleteChat(chatId: string) {
    if (!user) return;
    await deleteChatWithMessages(user.id, chatId);
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }

  // 5) Model selection
  function onSelectModel(model: Model) {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  }

  // 6) Toggle the sidebar
  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
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

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

  // We'll store "chats" in state whether user is signed in or not
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

  /* 
   * 1) If user is signed in, fetch their Firestore chats; 
   *    otherwise, do nothing (guest user sees only local data).
   */
  async function refreshChats() {
    if (isSignedIn && user) {
      const userChats = await fetchChats(user.id);
      setChats(userChats);
    }
  }
  useEffect(() => {
    refreshChats();
  }, [user, isSignedIn]);

  /*
   * 2) Load messages from Firestore only if user is signed in 
   *    and a chat is selected. If not signed in, messages are local only.
   */
  useEffect(() => {
    async function loadMessages() {
      if (!isSignedIn || !user || !selectedChatId) return;
      const msgs = await fetchMessagesForChat(user.id, selectedChatId);
      setMessages(msgs);
    }
    loadMessages();
  }, [selectedChatId, user, isSignedIn]);

  /*
   * 3) Handle sending a message:
   *    - If user is signed in => Firestore
   *    - If not => local-only ephemeral chat & messages
   */
  async function handleSendMessage(text: string) {
    // If not signed in, handle ephemeral chat
    if (!isSignedIn || !user) {
      let chatId = selectedChatId;
      // Create ephemeral chat if none selected
      if (!chatId) {
        chatId = "guest-" + nanoid(6);
        setSelectedChatId(chatId);
        setChats(prev => [
          ...prev,
          { id: chatId, title: "New Chat (Guest)", createdAt: new Date().toISOString() }
        ]);
      }
      // Add user message to local state
      setMessages(prev => [
        ...prev,
        { id: Date.now(), text, sender: "user", timestamp: new Date() }
      ]);
      // Simulate QnA API call
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
      // Add bot reply to local state
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() }
      ]);
      return;
    }

    // If user is signed in => Firestore logic
    let chatId = selectedChatId;
    if (!chatId) {
      // create a new Firestore chat if none is selected
      chatId = await createChat(user.id);
      setSelectedChatId(chatId);
      await refreshChats();
    }

    // Add user message to Firestore
    await addMessageToChat(user.id, chatId, text, "user");
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text, sender: "user", timestamp: new Date() }
    ]);

    // QnA API for bot response
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

    // Add bot message to Firestore
    await addMessageToChat(user.id, chatId, data.response, "bot");
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() }
    ]);
  }

  /*
   * 4) Delete chat:
   *    - If user not signed in => remove from local array
   *    - If user is signed in => remove from Firestore + local
   */
  async function handleDeleteChat(chatId: string) {
    if (!isSignedIn || !user) {
      // local removal only
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
      return;
    }

    // Signed in => remove from Firestore + local
    await deleteChatWithMessages(user.id, chatId);
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }

  // Model selection
  function onSelectModel(model: Model) {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  }

  // Toggle sidebar
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

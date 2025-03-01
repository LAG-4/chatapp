"use client";
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput"; // updated version below
import {
  addMessageToChat,
  fetchMessagesForChat
} from "../lib/chatService";

interface Model {
  id: string;
  name: string;
}

export default function Chatbot() {
  const { isSignedIn, user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Model selection states
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

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  function handleSelectModel(model: Model) {
    setSelectedModel(model);
  }

  // Load messages for the selected chat
  useEffect(() => {
    async function loadMessages() {
      if (user && selectedChatId) {
        const msgs = await fetchMessagesForChat(user.id, selectedChatId);
        setMessages(msgs);
      }
    }
    loadMessages();
  }, [selectedChatId, user]);

  // Send message to Firestore + QnA API
  async function handleSendMessage(text: string) {
    if (!user || !selectedChatId) return;

    // 1) Add user message
    await addMessageToChat(user.id, selectedChatId, text, "user");
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text, sender: "user", timestamp: new Date() }
    ]);

    // 2) Call QnA API for bot response
    const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        backend: "Groq",
        engine: selectedModel.id, // use the selected model
        temperature: 0.7,
        max_tokens: 150,
      }),
    });
    const data = await res.json();

    // 3) Add bot message
    await addMessageToChat(user.id, selectedChatId, data.response, "bot");
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() }
    ]);
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      <Sidebar
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-gray-800 flex items-center">
          <button onClick={toggleSidebar} className="mr-2">
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <span className="text-gray-300 text-sm">
            {selectedChatId ? `Chat: ${selectedChatId}` : "No chat selected"}
          </span>
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} />

        {/* Combined Model Selection + Message Input + Send Button */}
        <MessageInput
          onSend={handleSendMessage}
          models={models}
          selectedModel={selectedModel}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          onSelectModel={handleSelectModel}
        />
      </div>
    </div>
  );
}

// hooks/useChatLogic.ts

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";
import {
  fetchChats,
  createChat,
  addMessageToChat,
  fetchMessagesForChat,
  deleteChatWithMessages,
} from "../lib/chatService";

export interface Model {
  id: string;
  name: string;
  backend?: string;
}

export function useChatLogic() {
  // Clerk auth
  const { user, isSignedIn } = useUser();

  // Sidebar & Chat states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>({
    id: "llama-3.3-70b-versatile",
    name: "LLAMA 3.3",
    backend: "Groq",
  });

  // Model options
  const models: Model[] = [
    { id: "llama-3.3-70b-versatile", name: "LLAMA 3.3", backend: "Groq" },
    { id: "gemma2-9b-it", name: "GOOGLE GEMMA 2", backend: "Groq" },
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "DEEPSEEK R1(REASONING)",
      backend: "Groq",
    },
    {
      id: "llama-3.2-90b-vision-preview",
      name: "LLAMA 3.2",
      backend: "Groq",
    }
  ];

  // Fetch user chats if signed in
  async function refreshChats() {
    if (isSignedIn && user) {
      const userChats = await fetchChats(user.id);
      setChats(userChats);
    }
  }

  // On mount or user change, refresh chats
  useEffect(() => {
    refreshChats();
  }, [user, isSignedIn]);

  // If a chat is selected, load its messages from Firestore
  useEffect(() => {
    async function loadMessages() {
      if (!isSignedIn || !user || !selectedChatId) return;
      const msgs = await fetchMessagesForChat(user.id, selectedChatId);
      setMessages(msgs);
    }
    loadMessages();
  }, [selectedChatId, user, isSignedIn]);

  // Handle sending a new message
  async function handleSendMessage(text: string) {
    if (isLoading) return; // Prevent double submissions
    setIsLoading(true);

    try {
      // 1. Guest logic
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
    
        // Add user's message to local state
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text, sender: "user", timestamp: new Date() },
        ]);
    
        // POST request to your Flask endpoint
        const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: chatId,
            question: text,
            backend: selectedModel.backend,
            engine: selectedModel.id,
          }),
        });
        const data = await res.json();
    
        // Add bot's response to local state
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
        ]);
        return;
      }
    
      // 2. Signed-in logic
      let chatId = selectedChatId;
      if (!chatId) {
        chatId = await createChat(user.id);
        setSelectedChatId(chatId);
        await refreshChats();
      }
    
      // Store user's message in Firestore
      await addMessageToChat(user.id, chatId, text, "user");
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text, sender: "user", timestamp: new Date() },
      ]);
    
      // POST request to your Flask endpoint
      const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: chatId,
          question: text,
          backend: selectedModel.backend,
          engine: selectedModel.id,
        }),
      });
      const data = await res.json();
    
      // Store bot's response in Firestore
      await addMessageToChat(user.id, chatId, data.response, "bot");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now() + 1, 
          text: "Sorry, I encountered an error. Please try again.", 
          sender: "bot", 
          timestamp: new Date() 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle deleting a chat
  async function handleDeleteChat(chatId: string) {
    // Guest logic
    if (!isSignedIn || !user) {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
      return;
    }
    // Signed-in logic
    await deleteChatWithMessages(user.id, chatId);
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }

  // Toggle the sidebar
  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  // Select a model from the dropdown
  function onSelectModel(model: Model) {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  }

  return {
    // State
    sidebarOpen,
    chats,
    selectedChatId,
    messages,
    isDropdownOpen,
    selectedModel,
    models,
    isLoading,

    // Setters
    setSelectedChatId,
    setIsDropdownOpen,

    // Handlers
    toggleSidebar,
    onSelectModel,
    handleSendMessage,
    handleDeleteChat,
  };
}

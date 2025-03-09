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
} from "../lib/encryptedChatService";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export interface Model {
  id: string;
  name: string;
  backend?: string;
}

type ApiKeyType = 'primary' | 'secondary';

interface ApiKeys {
  primary: string | undefined;
  secondary: string | undefined;
}

interface ApiKeyFailures {
  primary: number;
  secondary: number;
}

// API key rotation logic
const API_KEYS: ApiKeys = {
  primary: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  secondary: process.env.NEXT_PUBLIC_GROQ_API_KEY_2
};

let currentApiKeyIndex: ApiKeyType = 'primary';
let apiKeyFailureCount: ApiKeyFailures = {
  primary: 0,
  secondary: 0
};

const MAX_FAILURES_BEFORE_SWITCH = 3;
const FAILURE_RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function getNextApiKey(): string | undefined {
  currentApiKeyIndex = currentApiKeyIndex === 'primary' ? 'secondary' : 'primary';
  return API_KEYS[currentApiKeyIndex];
}

function handleApiFailure(): string | undefined {
  apiKeyFailureCount[currentApiKeyIndex]++;
  
  if (apiKeyFailureCount[currentApiKeyIndex] >= MAX_FAILURES_BEFORE_SWITCH) {
    const previousKey = currentApiKeyIndex;
    const apiKey = getNextApiKey();
    
    // Reset failure count for the previous key after timeout
    setTimeout(() => {
      apiKeyFailureCount[previousKey] = 0;
    }, FAILURE_RESET_TIMEOUT);

    return apiKey;
  }
  
  return API_KEYS[currentApiKeyIndex];
}

export function useChatLogic() {
  const router = useRouter();
  // Clerk auth
  const { user, isSignedIn } = useUser();

  // Check if on mobile device
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  // Sidebar & Chat states
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Close by default on mobile
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestPromptCount, setGuestPromptCount] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<Model>({
    id: "gemini-2.0-flash",
    name: "GEMINI 2.0 FLASH",
    backend: "Google",
  });

  // Model options
  const models: Model[] = [
    { id: "gemini-2.0-flash", name: "GEMINI 2.0 FLASH", backend: "Google" },
    { id: "llama-3.3-70b-versatile", name: "LLAMA 3.3", backend: "Groq" },
    { id: "gemma2-9b-it", name: "GOOGLE GEMMA 2", backend: "Groq" },
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "DEEPSEEK R1",
      backend: "Groq",
    },
    {
      id: "llama-3.2-90b-vision-preview",
      name: "LLAMA 3.2",
      backend: "Groq",
    }
  ];

  // Load guest prompt count from localStorage on mount
  useEffect(() => {
    if (!isSignedIn) {
      const count = parseInt(localStorage.getItem('guestPromptCount') || '0');
      setGuestPromptCount(count);
    }
  }, [isSignedIn]);

  // Update localStorage when prompt count changes
  useEffect(() => {
    if (!isSignedIn) {
      localStorage.setItem('guestPromptCount', guestPromptCount.toString());
    }
  }, [guestPromptCount, isSignedIn]);

  // Reset guest state when user signs in
  useEffect(() => {
    if (isSignedIn) {
      localStorage.removeItem('guestLimitReached');
      localStorage.removeItem('guestPromptCount');
    }
  }, [isSignedIn]);

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
    if (isLoading) return;

    // Check guest prompt limit
    if (!isSignedIn && guestPromptCount >= 5) {
      // Show toast notification
      toast.error("You've reached the free chat limit! Redirecting to sign in...", {
        duration: 3000,
        position: "top-center",
      });

      // Add limit reached message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "You've reached the limit of 5 prompts for guest users. Please sign in to continue chatting and unlock all features!",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      // Set a flag in localStorage to indicate limit reached
      localStorage.setItem('guestLimitReached', 'true');

      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);

      return;
    }

    setIsLoading(true);

    try {
      // Create a new chat if there isn't one selected
      let chatId = selectedChatId;
      let isNewChat = false;

      if (!chatId && isSignedIn && user) {
        isNewChat = true;
        chatId = await createChat(user.id);
        const newChat = {
          id: chatId,
          title: "New Chat",
          createdAt: new Date(),
        };
        setChats(prev => [newChat, ...prev]);
        setSelectedChatId(chatId);
        // Wait for the state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      } else if (!chatId) {
        isNewChat = true;
        chatId = nanoid(10);
        const newChat = {
          id: chatId,
          title: "New Chat",
          createdAt: new Date(),
        };
        setChats(prev => [newChat, ...prev]);
        setSelectedChatId(chatId);
        // Wait for the state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Create the new message object
      const userMessage = { 
        id: Date.now(), 
        text, 
        sender: "user", 
        timestamp: new Date() 
      };

      // If this is a new chat, set messages directly instead of appending
      if (isNewChat) {
        setMessages([userMessage]);
      } else {
        setMessages(prev => [...prev, userMessage]);
      }

      // If user is signed in, save the message to Firestore
      if (isSignedIn && user && chatId) {
        await addMessageToChat(user.id, chatId, text, "user");
      }

      let response;

      // Handle Gemini 2.0 Flash requests
      if (selectedModel.backend === "Google") {
        try {
          // Format previous messages for context including the new message
          const messageHistory = isNewChat 
            ? [userMessage].map(msg => ({
                role: msg.sender === "user" ? "user" : "model",
                parts: [{ text: msg.text }]
              }))
            : [...messages, userMessage].map(msg => ({
                role: msg.sender === "user" ? "user" : "model",
                parts: [{ text: msg.text }]
              }));

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.id}:generateContent?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: messageHistory,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }),
          });

          if (!res.ok) {
            throw new Error('Failed to get response from Gemini');
          }

          const data = await res.json();
          response = data.candidates[0].content.parts[0].text;
        } catch (error) {
          console.error('Gemini API error:', error);
          throw error;
        }
      } else {
        // Handle Groq requests
        try {
          console.log('Using Groq API Key:', process.env.NEXT_PUBLIC_GROQ_API_KEY?.substring(0, 10) + '...');
          
          // Format previous messages for context including the new message
          const messageHistory = isNewChat 
            ? [{ role: "user", content: text }]
            : [...messages.map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text
              })), { role: "user", content: text }];

          const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: selectedModel.id,
              messages: messageHistory,
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            console.error('Groq API response error:', {
              status: res.status,
              statusText: res.statusText,
              errorData
            });
            throw new Error(`Failed to get response from Groq: ${res.status} ${res.statusText}`);
          }

          const data = await res.json();
          if (!data || !data.choices || !data.choices[0]) {
            console.error('Invalid Groq API response:', data);
            throw new Error('Invalid response format from Groq');
          }
          response = data.choices[0].message.content;
        } catch (error) {
          console.error('Groq API error:', error);
          throw error;
        }
      }

      // Add bot's response to messages
      const botMessage = { 
        id: Date.now() + 1, 
        text: response, 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMessage]);

      // If user is signed in, save the bot's response to Firestore
      if (isSignedIn && user && chatId) {
        await addMessageToChat(user.id, chatId, response, "bot");
        // Refresh the chat list to update the title
        await refreshChats();
      }

      // Increment guest prompt count if user is not signed in
      if (!isSignedIn) {
        setGuestPromptCount(prev => prev + 1);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage = error.message === 'All API keys are currently rate limited. Please try again later.'
        ? "We're experiencing high demand. Please try again in a few minutes."
        : "Sorry, I encountered an error. Please try again.";
      
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-center",
      });

      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now() + 1, 
          text: errorMessage,
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

  // Handle creating a new chat
  async function handleNewChat() {
    // Clear current messages
    setMessages([]);
    
    if (isSignedIn && user) {
      // Create new chat in Firestore
      const chatId = await createChat(user.id);
      setSelectedChatId(chatId);
      await refreshChats();
    } else {
      // For guest users, create a local chat
      const chatId = nanoid(10);
      const newChat = {
        id: chatId,
        title: "New Chat",
        createdAt: new Date(),
      };
      setChats(prev => [newChat, ...prev]);
      setSelectedChatId(chatId);
    }
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
    guestPromptCount,

    // Setters
    setSelectedChatId,
    setIsDropdownOpen,

    // Handlers
    toggleSidebar,
    onSelectModel,
    handleSendMessage,
    handleDeleteChat,
    handleNewChat,
  };
}

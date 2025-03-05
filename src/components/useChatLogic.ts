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

  // Sidebar & Chat states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestPromptCount, setGuestPromptCount] = useState<number>(0);
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
      // 1. Guest logic
      if (!isSignedIn || !user) {
        // Check if limit was previously reached
        const limitReached = localStorage.getItem('guestLimitReached') === 'true';
        if (limitReached) {
          toast.error("Chat limit reached. Please sign in to continue.", {
            duration: 3000,
            position: "top-center",
          });
          router.push('/sign-in');
          return;
        }

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
    
        // POST request to your Flask endpoint with API key rotation
        const makeRequest = async (retryCount = 0) => {
          try {
            const currentApiKey = API_KEYS[currentApiKeyIndex];
            const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentApiKey}`
              },
              body: JSON.stringify({
                session_id: chatId,
                question: text,
                backend: selectedModel.backend,
                engine: selectedModel.id,
              }),
            });

            if (!res.ok) {
              // Check for rate limit or API key specific errors
              if (res.status === 429 || res.status === 401 || res.status === 403) {
                const newApiKey = handleApiFailure();
                
                // If we have a new API key and haven't retried too many times, retry the request
                if (retryCount < 1 && newApiKey !== currentApiKey) {
                  return makeRequest(retryCount + 1);
                }
                
                throw new Error('All API keys are currently rate limited. Please try again later.');
              }
              throw new Error('Failed to get response');
            }

            // Reset failure count on success
            apiKeyFailureCount[currentApiKeyIndex] = 0;
            return await res.json();
          } catch (error) {
            if (retryCount < 1) {
              const newApiKey = handleApiFailure();
              if (newApiKey !== API_KEYS[currentApiKeyIndex]) {
                return makeRequest(retryCount + 1);
              }
            }
            throw error;
          }
        };

        const data = await makeRequest();
    
        // Add bot's response to local state
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
        ]);

        // Increment guest prompt count
        setGuestPromptCount(prev => prev + 1);
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
    
      // POST request with API key rotation for signed-in users
      const makeRequest = async (retryCount = 0) => {
        try {
          const currentApiKey = API_KEYS[currentApiKeyIndex];
          const res = await fetch("https://qna-chatbot-0uel.onrender.com/chat", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
              session_id: chatId,
              question: text,
              backend: selectedModel.backend,
              engine: selectedModel.id,
            }),
          });

          if (!res.ok) {
            if (res.status === 429 || res.status === 401 || res.status === 403) {
              const newApiKey = handleApiFailure();
              if (retryCount < 1 && newApiKey !== currentApiKey) {
                return makeRequest(retryCount + 1);
              }
              throw new Error('All API keys are currently rate limited. Please try again later.');
            }
            throw new Error('Failed to get response');
          }

          // Reset failure count on success
          apiKeyFailureCount[currentApiKeyIndex] = 0;
          return await res.json();
        } catch (error) {
          if (retryCount < 1) {
            const newApiKey = handleApiFailure();
            if (newApiKey !== API_KEYS[currentApiKeyIndex]) {
              return makeRequest(retryCount + 1);
            }
          }
          throw error;
        }
      };

      const data = await makeRequest();
    
      // Store bot's response in Firestore
      await addMessageToChat(user.id, chatId, data.response, "bot");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.response, sender: "bot", timestamp: new Date() },
      ]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show appropriate error message to user
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
  };
}

// pages/chat.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useChatLogic } from "./useChatLogic";
import UserSync from "../components/UserSync";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { Menu, X } from "lucide-react";

export default function Chatbot() {
  const { isSignedIn } = useUser();
  const {
    sidebarOpen,
    chats,
    selectedChatId,
    messages,
    isDropdownOpen,
    selectedModel,
    models,
    isLoading,
    guestPromptCount,
    setSelectedChatId,
    setIsDropdownOpen,
    toggleSidebar,
    onSelectModel,
    handleSendMessage,
    handleDeleteChat,
  } = useChatLogic();

  // State for showing/hiding the mobile warning banner
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    // Check if user is on a mobile device by user agent
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setShowMobileWarning(true);
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* If user is on mobile, show a dismissible banner */}
      {showMobileWarning && (
        <div className="flex items-center justify-between bg-orange-600 text-white px-4 py-2 z-50">
          <span className="font-semibold text-sm md:text-base">
            We do NOT support mobile yet. Use with caution.
          </span>
          <button
            onClick={() => setShowMobileWarning(false)}
            className="ml-4 p-1 hover:bg-orange-500 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Show remaining prompts for guest users */}
      {!isSignedIn && guestPromptCount < 5 && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">
              Free Prompts Available – Log in to unlock more options: {5 - guestPromptCount}
              </span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#02ece9] to-[#70ec00]" 
                  style={{ width: `${((5 - guestPromptCount) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync user data to Firestore */}
      <UserSync />

      {/* Sidebar overlaid on the left (fixed) */}
      <Sidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onDeleteChat={handleDeleteChat}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Mobile-only hamburger button when sidebar is closed.
          If banner is visible, push it further down with top-16. Otherwise top-4. */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className={`absolute left-4 z-50 p-2 bg-gray-800 rounded-md text-gray-300 md:hidden
            ${showMobileWarning ? "top-16" : "top-4"}`}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Main content area */}
      <div className="md:pl-64 flex-1 flex flex-col">
        {/* Scrollable chat messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>
        <MessageInput
          onSend={handleSendMessage}
          models={models}
          selectedModel={selectedModel}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          onSelectModel={onSelectModel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

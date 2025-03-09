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
    handleNewChat,
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
    <div className={`relative w-full min-h-screen bg-[#1a1a1a] text-white flex flex-col ${
      sidebarOpen ? 'overflow-hidden h-screen' : ''
    }`}>
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

      {/* Sync user data to Firestore */}
      <UserSync />

      {/* Overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar overlaid on the left (fixed) */}
      <Sidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onDeleteChat={handleDeleteChat}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onNewChat={handleNewChat}
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
      <div className={`flex-1 md:ml-64 flex flex-col ${
        // Only apply margin on desktop (md and up)
        sidebarOpen ? "md:ml-64" : ""
      }`}>
        {/* Scrollable chat messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>
        
        {/* Free prompts message above chat input */}
        {!isSignedIn && guestPromptCount < 5 && (
          <div className="px-4 py-2 bg-[#1a1a1a] border-t border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <span className="text-yellow-500 text-sm">
                You only have {5 - guestPromptCount} messages left.
              </span>
              <a href="/sign-in" className="text-[#70ec00] hover:underline text-sm">
                Sign in to reset your limits
              </a>
            </div>
          </div>
        )}
        
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

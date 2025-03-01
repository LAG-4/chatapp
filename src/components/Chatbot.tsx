// pages/chat.tsx
import React from "react";
import { useChatLogic } from "./useChatLogic";
import UserSync from "../components/UserSync";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { Menu } from "lucide-react";

export default function Chatbot() {
  const {
    sidebarOpen,
    chats,
    selectedChatId,
    messages,
    isDropdownOpen,
    selectedModel,
    models,
    setSelectedChatId,
    setIsDropdownOpen,
    toggleSidebar,
    onSelectModel,
    handleSendMessage,
    handleDeleteChat,
  } = useChatLogic();

  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] text-white overflow-hidden">
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

      {/* 
        Mobile-only hamburger button when sidebar is closed.
        Absolutely positioned so it doesn't shift content.
      */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-md text-gray-300 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Main content area:
         - On desktop, offset by pl-64 so the sidebar is always visible
         - On mobile, the content remains full width behind the sidebar
      */}
      <div className="absolute inset-0 md:pl-64 flex flex-col">
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

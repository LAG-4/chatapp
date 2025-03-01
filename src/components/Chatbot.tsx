// pages/chat.tsx

import React from "react";
import { useChatLogic } from "./useChatLogic";
import UserSync from "../components/UserSync";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

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

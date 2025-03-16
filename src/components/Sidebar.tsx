// components/Sidebar.tsx
"use client";
import React from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { X, MessageSquare, Plus } from "lucide-react";

interface SidebarProps {
  chats: any[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  onNewChat: () => void;
}

export default function Sidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  sidebarOpen,
  toggleSidebar,
  onNewChat,
}: SidebarProps) {
  const { isSignedIn, user } = useUser();

  return (
    <div
      className={`
        fixed top-14 left-0 z-40
        h-[calc(100dvh-3.5rem)]
        bg-[#1a1a1a]
        border-r border-gray-800
        flex flex-col
        overflow-hidden
        transition-all duration-300
        ${
          // On mobile, show w-2/3 if open, else w-0
          // On md+, always w-64
          sidebarOpen ? "w-2/3 md:w-64" : "w-0 md:w-64"
        }
      `}
    >


      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="shrink-0 m-4 p-3 flex items-center justify-center gap-2 bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        <Plus className="w-5 h-5" />
        New Chat
      </button>

      {/* Chat List - Make it scrollable but constrain height */}
      <div className="flex-1 overflow-y-auto min-h-0 overscroll-none">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center justify-between p-3 hover:bg-gray-800 cursor-pointer transition-colors ${
              selectedChatId === chat.id ? "bg-gray-700" : ""
            }`}
            onClick={() => {
              onSelectChat(chat.id);
              // Close sidebar on mobile when chat is selected
              if (window.innerWidth < 768) {
                toggleSidebar();
              }
            }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">
                  {chat.title || "New Chat"}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 border-t border-gray-800 mt-auto">
        {isSignedIn ? (
          <div className="flex items-center space-x-2 text-sm">
            <span>Hello, {user?.firstName || "User"}</span>
            <UserButton />
          </div>
        ) : (
          <SignInButton />
        )}
      </div>
    </div>
  );
}

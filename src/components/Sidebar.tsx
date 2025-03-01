// components/Sidebar.tsx
"use client";
import React from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { X } from "lucide-react";

interface SidebarProps {
  chats: any[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  sidebarOpen,
  toggleSidebar,
}: SidebarProps) {
  const { isSignedIn, user } = useUser();

  return (
    <div
      className={`
        fixed top-0 left-0 z-40
        h-screen
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
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-base md:text-lg font-medium">LAG.AI</h1>
        {/* Close button only on mobile (md:hidden) */}
        <button onClick={toggleSidebar} className="text-gray-300 md:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-3 hover:bg-gray-800 ${
              selectedChatId === chat.id ? "bg-gray-700" : ""
            }`}
          >
            <div
              onClick={() => onSelectChat(chat.id)}
              className="cursor-pointer flex-1 text-sm"
            >
              {chat.title || "Untitled Chat"}
            </div>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="text-red-500 hover:text-red-400 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
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

// components/Sidebar.tsx
"use client";
import React from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

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
    <div className="relative" style={{ height: "100%" }}>
      {/* The sliding sidebar */}
      <div
        className={`
          h-full
          ${sidebarOpen ? "w-64" : "w-0"}
          transition-all duration-300
          border-r border-gray-800
          flex flex-col
          overflow-hidden
        `}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-lg font-medium">LAG.AI</h1>
          {sidebarOpen && (
            <button onClick={toggleSidebar} className="text-gray-300">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

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
                className="cursor-pointer flex-1"
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

        <div className="p-4 border-t border-gray-800">
          {isSignedIn ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm">Hello, {user?.firstName || "User"}</span>
              <UserButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-0 z-20 p-2 bg-gray-800 rounded-r-md text-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { createChat, fetchChats } from "../lib/chatService";
import { Search, Edit } from "lucide-react";

interface SidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({
  selectedChatId,
  onSelectChat,
  sidebarOpen,
  toggleSidebar,
}: SidebarProps) {
  const { isSignedIn, user } = useUser();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (isSignedIn && user) {
      fetchChats(user.id).then(setChats);
    }
  }, [isSignedIn, user]);

  async function handleNewChat() {
    if (!user) return;
    const chatId = await createChat(user.id);
    const updated = await fetchChats(user.id);
    setChats(updated);
    onSelectChat(chatId);
  }

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-0"
      } transition-all duration-300 border-r border-gray-800 flex flex-col overflow-hidden`}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-lg font-medium">LAG.AI</h1>
        <button onClick={handleNewChat} className="text-sm text-gray-300">
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Chat list */}
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-3 cursor-pointer hover:bg-gray-800 ${
              selectedChatId === chat.id ? "bg-gray-700" : ""
            }`}
          >
            {chat.title || "Untitled Chat"}
          </div>
        ))}
      </div>

      {/* Auth section */}
      <div className="p-4 border-t border-gray-800">
        {isSignedIn ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm">
              Hello, {user?.firstName || "User"}
            </span>
            <UserButton />
          </div>
        ) : (
          <SignInButton />
        )}
      </div>
    </div>
  );
}

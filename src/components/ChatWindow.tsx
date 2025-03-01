"use client";
import React from "react";

interface ChatWindowProps {
  messages: any[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`mb-4 p-3 rounded-lg max-w-3/4 ${
            msg.sender === "user" ? "ml-auto bg-purple-700" : "bg-gray-800"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}

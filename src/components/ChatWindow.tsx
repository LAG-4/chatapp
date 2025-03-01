// components/ChatWindow.tsx
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface ChatWindowProps {
  messages: any[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`mb-4 p-3 rounded-lg max-w-3/4 ${
            msg.sender === "user" ? "ml-auto bg-purple-700" : "bg-gray-800"
          }`}
        >
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {msg.text}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}

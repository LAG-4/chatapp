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
  // If there are no messages, display a welcome screen
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to the MultiChat App by{" "}
            <a href="https://x.com/lag_aryan" style={{ color: "#70ec00" }}>
              LAG
            </a>
          </h1>
          <h2 className="text-lg text-gray-300">
            Your advanced AI conversation platform, ready to handle any question or topic.
          </h2>
          <h3 className="text-sm text-gray-300">
            Access multiple frontier chat models (LLMs) in one place—from coding assistance to creative brainstorming.
          </h3>
          <h3 className="text-sm text-gray-300">
            Unlock the power of next‐generation AI and experience seamless, intelligent conversations.
          </h3>
        </div>
      </div>
    );
  }

  // Otherwise, display the messages
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

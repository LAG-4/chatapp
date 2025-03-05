// components/ChatWindow.tsx
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useAutoScroll } from "@/hooks/useAutoScroll";

interface ChatWindowProps {
  messages: any[];
  isLoading?: boolean;
}

export default function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const { messagesEndRef, chatContainerRef } = useAutoScroll(messages);

  // Function to process message text and extract think content
  const processMessageContent = (text: string) => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    const mainContent = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thinkContent: thinkMatch ? thinkMatch[1].trim() : null, mainContent };
  };

  // If there are no messages, display a welcome screen
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 relative h-[calc(100vh-8rem)]">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center max-w-2xl px-4">
            <h1 className="text-3xl font-bold mb-6">
              Welcome to the MultiChat App by{" "}
              <a href="https://x.com/lag_aryan" style={{ color: "#70ec00" }}>
                LAG
              </a>
            </h1>
            <h2 className="text-lg text-gray-300 mb-4">
              Your advanced AI conversation platform, ready to handle any question or topic.
            </h2>
            <h3 className="text-sm text-gray-300 mb-3">
              Access multiple frontier chat models (LLMs) in one place—from coding assistance to creative brainstorming.
            </h3>
            <h3 className="text-sm text-gray-300">
              Unlock the power of next‐generation AI and experience seamless, intelligent conversations.
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, display the messages
  return (
    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
      {messages.map((msg) => {
        const { thinkContent, mainContent } = processMessageContent(msg.text);
        return (
          <div key={msg.id} className="mb-4">
            {thinkContent && msg.sender === "bot" && (
              <div className="mb-2 p-4 rounded-lg bg-gray-900/50 border border-gray-800 max-w-[85%] lg:max-w-[70%]">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    />
                    <path 
                      d="M12 8V16M8 12H16" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-medium">Thinking Process</span>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap">{thinkContent}</div>
              </div>
            )}
            <div className={`p-3 rounded-lg ${
              msg.sender === "user" 
                ? "ml-auto bg-purple-700 max-w-[85%] lg:max-w-[70%]" 
                : "bg-gray-800 max-w-[85%] lg:max-w-[70%]"
            }`}>
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {mainContent || msg.text}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
      {isLoading && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-800 max-w-[85%] lg:max-w-[70%] animate-pulse">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#02ece9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#02ece9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#02ece9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-gray-400">AI is thinking...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

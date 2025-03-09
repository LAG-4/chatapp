// components/ChatWindow.tsx
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/github-dark.css";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useUser } from "@clerk/nextjs";
import CodeSnippet from "./CodeSnippet";
import { Components } from "react-markdown";
import { toast } from "react-hot-toast";

interface ChatWindowProps {
  messages: any[];
  isLoading?: boolean;
}

export default function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const { user } = useUser();
  const { messagesEndRef, chatContainerRef } = useAutoScroll(messages);

  // Function to process message text and extract think content
  const processMessageContent = (text: string) => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    const mainContent = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thinkContent: thinkMatch ? thinkMatch[1].trim() : null, mainContent };
  };

  // Add copy function
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Copied to clipboard!', {
          duration: 2000,
          position: 'top-center'
        });
      })
      .catch(() => {
        toast.error('Failed to copy text', {
          duration: 2000,
          position: 'top-center'
        });
      });
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
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto h-[calc(100vh-8rem)] relative">
      <div className="absolute inset-0">
        <div className="min-h-full p-4 pt-24">
          {messages.map((msg) => {
            const { thinkContent, mainContent } = processMessageContent(msg.text);
            return (
              <div key={msg.id} className="mb-8">
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
                    <div className="text-gray-300 whitespace-pre-wrap break-words">{thinkContent}</div>
                  </div>
                )}
                <div className={`flex ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2`}>
                  <div className="flex flex-col items-center shrink-0">
                    {msg.sender === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-white">
                            {user?.firstName?.[0] || "U"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#02ece9] flex items-center justify-center">
                        <svg 
                          viewBox="0 0 24 24" 
                          className="w-5 h-5 text-gray-800" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            fill="currentColor"
                          />
                          <path 
                            d="M9 9h6M9 12h6M9 15h6" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 mt-1">
                      {msg.sender === "user" ? (user?.firstName || "User") : "AI"}
                    </span>
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className={`${
                      msg.sender === "user" 
                        ? "bg-purple-700 p-3 rounded-lg max-w-[85%] lg:max-w-[70%] self-end" 
                        : "text-gray-200 pl-2 max-w-[85%] lg:max-w-[70%]"
                    } overflow-hidden break-words`}>
                      <ReactMarkdown
                        components={{
                          code: ({ className, children }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : 'text';
                            const isInline = !match;
                            
                            if (isInline) {
                              return (
                                <code className="bg-gray-800 rounded px-1">
                                  {children}
                                </code>
                              );
                            }
                            
                            return (
                              <CodeSnippet
                                code={String(children).replace(/\n$/, '')}
                                language={language}
                              />
                            );
                          }
                        }}
                      >
                        {mainContent || msg.text}
                      </ReactMarkdown>
                    </div>
                    <div className={`flex ${msg.sender === "user" ? "justify-end mr-2" : "justify-start"} mt-2`}>
                      <button
                        onClick={() => handleCopy(msg.text)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300"
                        title="Copy full message"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy message
                      </button>
                    </div>
                  </div>
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
      </div>
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import { Search, Edit, Send, Menu, X, ChevronDown } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs'

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: Date;
}

interface Model {
  id: string;
  name: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>({ id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile' });

  const models: Model[] = [
    { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile' },
    { id: 'gemma2-9b-it', name: 'gemma2-9b-it' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'deepseek-r1-distill-llama-70b' },
    { id: 'llama-3.2-90b-vision-preview', name: 'llama-3.2-90b-vision-preview' },
  ];

  const exampleChats: Chat[] = [
    { id: 1, name: "New Chat", lastMessage: "Hello! How can I help you today?", timestamp: new Date() }
  ];

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      // Create and display user's message
      const newMessage: Message = {
        id: Date.now(),
        text: inputMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      const questionToSend = inputMessage;
      setInputMessage('');

      // Call the API for all models using the selected model's id
      fetch('https://qna-chatbot-0uel.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: questionToSend,
          backend: "Groq",
          engine: selectedModel.id,
          temperature: 0.7,
          max_tokens: 150
        })
      })
      .then(res => res.json())
      .then(data => {
        const botResponse: Message = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      })
      .catch(error => {
        console.error("Error:", error);
        const errorMessage: Message = {
          id: Date.now() + 2,
          text: "Sorry, there was an error retrieving the response.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const selectModel = (model: Model) => {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-800 flex items-center">
          <h1 className="text-lg font-medium">LAG.AI</h1>
          <div className="ml-auto flex space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Edit className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Chat history */}
          {exampleChats.map(chat => (
            <div key={chat.id} className="p-3 hover:bg-gray-800 cursor-pointer">
              <div className="font-medium">{chat.name}</div>
              <div className="text-sm text-gray-400 truncate">{chat.lastMessage}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
        <SignInButton/>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center">
          <button onClick={toggleSidebar} className="mr-2">
            {sidebarOpen ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
          </button>
          <span className="text-gray-300 text-sm">New Chat</span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map(message => (
            <div
              key={message.id}
              className={`mb-4 p-3 rounded-lg max-w-3/4 ${message.sender === 'user' ? 'ml-auto bg-purple-700' : 'bg-gray-800'}`}
            >
              {message.text}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-800 flex items-center">
          <input
            type="text"
            placeholder="Type your message here..."
            className="flex-1 bg-transparent border-none outline-none"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <div className="flex items-center relative">
            {/* Custom Dropdown */}
            <div className="relative mr-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-sm rounded-md px-3 py-1.5 transition-colors"
              >
                <span className="text-gray-300 whitespace-nowrap">{selectedModel.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {isDropdownOpen && (
                <div className="absolute bottom-full mb-1 right-0 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-10">
                  <div className="py-1">
                    {models.map(model => (
                      <button
                        key={model.id}
                        onClick={() => selectModel(model)}
                        className={`block w-full text-left px-4 py-2 text-sm ${selectedModel.id === model.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'linear-gradient(to right, #02ece9, #70ec00)' }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

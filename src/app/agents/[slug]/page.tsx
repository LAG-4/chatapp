"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Brain, Youtube, Globe as GlobeIcon, DollarSign, BarChart3, Code, ExternalLink, Newspaper, FileUser, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAutoScroll } from '@/hooks/useAutoScroll';

const agents = {
  "news-summarizer": {
    name: "News Summarizer Agent",
    description: "Takes a news URL or a keyword from the user and returns a summary of the news article or keyword",
    placeholder: "Enter a news URL or keyword...",
    icon: <Newspaper className="w-12 h-12 text-yellow-400" />
  },
  "video-script-generator": {
    name: "Youtube Agent",
    description: "This agent analyzes YouTube videos and provides detailed summaries, timestamps, and key points.",
    placeholder: "Enter a YouTube video URL...",
    icon: <Youtube className="w-12 h-12 text-red-500" />
  },
  "research-agent": {
    name: "Research Agent",
    description: "This agent conducts comprehensive research on a given topic and provides a detailed report.",
    placeholder: "Enter your research topic...",
    icon: <Brain className="w-12 h-12 text-blue-400" />
  },
  "web-design-grader": {
    name: "Resume & Cover Letter Enhancer",
    description: "Analyze and grade website designs",
    placeholder: "Upload your resume or cover letter...",
    icon: <FileUser className="w-12 h-12 text-green-400" />
  },
  "analytics-interpreter": {
    name: "Travel Itinerary Planner",
    description: "Provide a destination, travel dates, and user preferences and get a detailed travel itinerary",
    placeholder: "Enter your travel details...",
    icon: <Plane className="w-12 h-12 text-purple-400" />
  },
  "code-assistant": {
    name: "Code Assistant Pro",
    description: "Get help with coding and debugging",
    placeholder: "Describe your coding question or paste your code...",
    icon: <Code className="w-12 h-12 text-cyan-400" />
  }
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  relatedNews?: {
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }[];
}

export default function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { messagesEndRef, chatContainerRef } = useAutoScroll(messages);

  // Handle textarea height and scroll adjustment
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-adjust height
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    
    // Scroll chat up when input grows
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const agent = agents[resolvedParams.slug as keyof typeof agents];

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#02ece9] mb-4">Agent Not Found</h1>
          <p className="text-gray-400 mb-8">The agent you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/agents')}
            className="bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Determine if input is a URL or keyword
      const type = userMessage.startsWith('http') ? 'url' : 'keyword';
      
      const response = await fetch('/api/news-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userMessage,
          type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the news agent');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.analysis,
        relatedNews: data.relatedNews
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-gray-800">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-[#02ece9] font-semibold text-lg">{agent.name}</h1>
            <button 
              onClick={() => router.push('/agents')}
              className="flex items-center gap-2 text-white hover:text-[#02ece9] transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Back to Agents</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="fixed inset-0 pt-16">
        {/* Scrollable Content Area */}
        <div 
          ref={chatContainerRef}
          className="h-[calc(100vh-16px-80px)] overflow-y-auto px-4 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto py-8">
            {/* Agent Info Card */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-800">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-gray-800 flex items-center justify-center mb-4">
                  {agent.icon}
                </div>
                <h2 className="text-2xl font-bold text-[#02ece9] mb-2">{agent.name}</h2>
                <p className="text-gray-400">{agent.description}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-20">
              <div ref={chatContainerRef} className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-lg break-words ${
                        message.role === 'user'
                          ? 'bg-purple-700/90'
                          : 'bg-gray-800'
                      } max-w-[85%]`}
                    >
                      <div className="prose prose-invert max-w-none">
                        {message.content}
                      </div>
                    </div>
                    {message.relatedNews && message.relatedNews.length > 0 && (
                      <div className="mt-4 space-y-3 w-full">
                        <h3 className="text-[#02ece9] font-semibold text-sm">Related News:</h3>
                        {message.relatedNews.map((news, i) => (
                          <a
                            key={i}
                            href={news.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700"
                          >
                            <div className="flex items-start gap-3">
                              <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 text-[#02ece9]" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-sm mb-1 break-words">{news.title}</h4>
                                <p className="text-sm text-gray-400 mb-2 break-words line-clamp-2">{news.description}</p>
                                <p className="text-xs text-gray-500">{new Date(news.pubDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-gray-800 p-4 rounded-lg max-w-[85%] animate-pulse">
                    Analyzing content and finding related news...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Chat Input at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#060606] border-t border-gray-800 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={agent.placeholder}
                className="flex-1 bg-[#1a1a1a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02ece9] resize-none transition-all duration-200"
                style={{ minHeight: '50px', maxHeight: '150px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
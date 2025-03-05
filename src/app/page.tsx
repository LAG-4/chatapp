"use client";
import { useEffect, useState } from 'react';
import Chatbot from "../components/Chatbot";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Perform the GET request on page launch
    fetch('https://qna-chatbot-0uel.onrender.com/')
      .then(response => response.text())
      .then(data => {
        console.log('API response:', data);
      })
      .catch(error => {
        console.error('Error calling API:', error);
      });
  }, []);

  // Don't render anything until the component is mounted
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      {/* Document Chat Feature Promotion */}
      <div className="fixed top-6 right-6 z-30">
        <a 
          href="/document" 
          className="group flex items-center gap-2 bg-[#02ece9] text-black font-medium px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <svg 
            className="w-4 h-4 transition-transform group-hover:rotate-12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Try Document Chat
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            New
          </span>
        </a>
      </div>

      <Chatbot />
    </div>
  );
}

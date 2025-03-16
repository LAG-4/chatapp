"use client";
import React from "react";
import Link from "next/link";
import { Menu, FileText, Bot } from "lucide-react";

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-3 sm:px-4">
      {/* Left side - Mobile menu button and Logo */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-2 p-1.5 text-gray-300 hover:bg-gray-800 rounded-md md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <Link href="/" className="flex items-center">
          <h1 className="text-base sm:text-lg font-medium bg-gradient-to-r from-[#02ece9] to-[#70ec00] bg-clip-text text-transparent">
            LAG.AI
          </h1>
        </Link>
      </div>
      
      {/* Right side - Action buttons */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Agents Button */}
        <Link 
          href="/agents" 
          className="group relative flex items-center justify-center sm:justify-start gap-1 sm:gap-2 
                    px-2 sm:px-4 py-1.5 sm:py-2 
                    border border-[#70ec00]/70 text-[#70ec00] font-medium 
                    rounded-md hover:bg-[#70ec00]/10 transition-colors duration-200"
        >
          <Bot className="w-4 h-4 group-hover:animate-pulse" />
          <span className="hidden sm:inline">Try Agents</span>
          <div className="absolute -top-1 -right-1 sm:top-0 sm:right-0 sm:transform sm:translate-x-1/3 sm:-translate-y-1/3">
            <span className="inline-flex items-center justify-center 
                          px-1 sm:px-2 py-0.5 
                          text-[0.65rem] sm:text-xs font-bold leading-none 
                          text-black bg-gradient-to-r from-[#70ec00] to-[#02ece9] rounded">
              NEW
            </span>
          </div>
        </Link>
        
        {/* Document Chat Button */}
        <Link 
          href="/document" 
          className="group relative flex items-center justify-center sm:justify-start gap-1 sm:gap-2 
                    px-2 sm:px-4 py-1.5 sm:py-2 
                    border border-[#02ece9]/70 text-[#02ece9] font-medium 
                    rounded-md hover:bg-[#02ece9]/10 transition-colors duration-200"
        >
          <FileText className="w-4 h-4 group-hover:animate-pulse" />
          <span className="hidden sm:inline">Document Chat</span>
          <div className="absolute -top-1 -right-1 sm:top-0 sm:right-0 sm:transform sm:translate-x-1/3 sm:-translate-y-1/3">
            <span className="inline-flex items-center justify-center 
                          px-1 sm:px-2 py-0.5 
                          text-[0.65rem] sm:text-xs font-bold leading-none 
                          text-black bg-gradient-to-r from-[#02ece9] to-[#70ec00] rounded">
              NEW
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
} 
// components/MessageInput.tsx
"use client";
import React, { useState } from "react";
import { ChevronDown, Send } from "lucide-react";

interface Model {
  id: string;
  name: string;
}

interface MessageInputProps {
  onSend: (text: string) => void;
  models: Model[];
  selectedModel: Model;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  onSelectModel: (model: Model) => void;
}

export default function MessageInput({
  onSend,
  models,
  selectedModel,
  isDropdownOpen,
  setIsDropdownOpen,
  onSelectModel,
}: MessageInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleSend() {
    if (inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue("");
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSend();
    }
  }

  return (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center gap-2 max-w-full">
        <input
          type="text"
          className="flex-1 min-w-0 bg-transparent border-none outline-none"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <div className="flex-shrink-0 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-sm rounded-md px-3 py-1.5 transition-colors"
          >
            <span className="text-gray-300 whitespace-nowrap">
              {selectedModel.name}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {isDropdownOpen && (
            <div className="absolute bottom-full mb-1 right-0 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-10">
              <div className="py-1">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedModel.id === model.id
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "linear-gradient(to right, #02ece9, #70ec00)" }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

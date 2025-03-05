"use client";
import React, { useState, useRef, useEffect } from "react";
import { Upload, Send, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Squares } from "@/components/ui/squares-background";
import { useAutoScroll } from "@/hooks/useAutoScroll";

interface StoredDocument {
  name: string;
  timestamp: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [previousDocs, setPreviousDocs] = useState<StoredDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const { messagesEndRef, chatContainerRef } = useAutoScroll(messages);

  useEffect(() => {
    // Load previous documents from local storage
    const storedDocs = localStorage.getItem('uploadedDocuments');
    if (storedDocs) {
      setPreviousDocs(JSON.parse(storedDocs));
    }
  }, []);

  const addToDocumentHistory = (fileName: string) => {
    const newDoc = {
      name: fileName,
      timestamp: Date.now()
    };
    
    const updatedDocs = [newDoc, ...previousDocs.filter(doc => doc.name !== fileName)].slice(0, 10); // Keep last 10 docs
    setPreviousDocs(updatedDocs);
    localStorage.setItem('uploadedDocuments', JSON.stringify(updatedDocs));
  };

  const removeFromHistory = (fileName: string) => {
    const updatedDocs = previousDocs.filter(doc => doc.name !== fileName);
    setPreviousDocs(updatedDocs);
    localStorage.setItem('uploadedDocuments', JSON.stringify(updatedDocs));
    if (selectedDoc === fileName) {
      setSelectedDoc(null);
      setMessages([]);
    }
  };

  const selectDocument = (fileName: string) => {
    setSelectedDoc(fileName);
    setFile(null); // Clear current file
    setMessages([]); // Clear current messages
    setError(""); // Clear any errors
    // Trigger question answering for the selected document
    askQuestionForDocument(fileName);
  };

  const askQuestionForDocument = async (fileName: string) => {
    try {
      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Please provide a brief summary of this document.",
          fileName: fileName,
          maxTokens: 4000,
        }),
      });

      const data = await response.json();
      
      if (response.status === 413) {
        throw new Error('The document is too large. A brief summary will be provided.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get summary');
      }

      if (!data.answer) {
        throw new Error('No summary received from the server');
      }

      setMessages([{ role: "assistant", content: data.answer }]);
    } catch (error: any) {
      console.error('Error getting document summary:', error);
      if (error.message.includes('too large')) {
        setError('The document is too large. Try asking specific questions about sections you are interested in.');
        setMessages([{ 
          role: "assistant", 
          content: "This document is quite large. I'll be able to answer specific questions about particular sections or topics. What would you like to know about?" 
        }]);
      } else {
        setError(error.message || 'Error retrieving document summary');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFile(file);
      setError("");
      addToDocumentHistory(file.name);
      setSelectedDoc(null);
      await processDocument(file);
    },
  });

  const processDocument = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunkSize', '2000');

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      if (!data.summary) {
        throw new Error('No summary received from the server');
      }

      setSummary(data.summary);
      setMessages([{ role: "assistant", content: data.summary }]);
    } catch (error: any) {
      console.error('Error processing document:', error);
      setError(error.message || 'Error processing document');
      setMessages([{ role: "assistant", content: "Error: Failed to process document. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || (!file && !selectedDoc)) return;

    const userQuestion = question;
    setMessages(prev => [...prev, { role: "user", content: userQuestion }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          fileName: file ? file.name : selectedDoc,
          maxTokens: 4000,
        }),
      });

      const data = await response.json();

      if (response.status === 413) {
        throw new Error('The document is too large. Try asking a more specific question.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      if (!data.answer) {
        throw new Error('No answer received from the server');
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error: any) {
      console.error('Error asking question:', error);
      if (error.message.includes('too large')) {
        setError('The document is too large. Try asking a more specific question about a particular section or topic.');
      } else {
        setError(error.message || 'Error asking question');
      }
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: error.message.includes('too large') 
          ? "The document is too large for me to process all at once. Please try asking a more specific question about a particular section or topic."
          : "Error: Failed to get answer. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void askQuestion();
    }
  };

  // Add styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body.sidebar-open .sidebar-overlay {
        display: block !important;
      }
      
      body.sidebar-open .mobile-sidebar {
        transform: translateX(0) !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add proper type for the Squares component props
  type SquaresProps = {
    direction: "diagonal";
    speed: number;
    squareSize: number;
    borderColor: string;
    hoverFillColor: string;
  };

  return (
    <div className="relative min-h-screen bg-[#060606] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-gray-800">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-[#02ece9] font-semibold text-lg">Document Chat</h1>
            <a 
              href="/" 
              className="flex items-center gap-2 text-white hover:text-[#02ece9] transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              <span>Back to MultiChat</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Background squares */}
      <div className="absolute inset-0 z-0">
        <Squares 
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#333" 
          hoverFillColor="#222"
        />
      </div>

      {/* Content - Add padding-top to account for fixed navbar */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen pt-16">
        {/* Sidebar - Only visible on desktop */}
        <div className="hidden lg:block w-64 bg-[#1a1a1a] border-r border-gray-800">
         
          <div className="overflow-y-auto h-[calc(100vh-80px)] bg-[#1a1a1a]">
            <div className="p-4 space-y-2">
              {previousDocs.map((doc) => (
                <div 
                  key={doc.name}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedDoc === doc.name 
                      ? 'bg-[#02ece9]/10 border border-[#02ece9]/50' 
                      : 'hover:bg-gray-800/50 border border-transparent'}`}
                  onClick={() => selectDocument(doc.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      selectDocument(doc.name);
                    }
                  }}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileText className="w-4 h-4 flex-shrink-0 text-[#02ece9]" />
                    <span className="truncate text-sm text-white">{doc.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(doc.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label={`Remove ${doc.name} from history`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {previousDocs.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No documents yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen overflow-auto">
          <div className="p-4">
            {/* Mobile Document History */}
            <div className="lg:hidden mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#02ece9]">Recent Documents</h2>
              <div className="space-y-2">
                {previousDocs.slice(0, 3).map((doc) => (
                  <div 
                    key={doc.name}
                    className={`flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]/90 backdrop-blur-sm border transition-colors
                      ${selectedDoc === doc.name 
                        ? 'border-[#02ece9]/50 bg-[#02ece9]/10' 
                        : 'border-transparent'}`}
                    onClick={() => selectDocument(doc.name)}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileText className="w-4 h-4 flex-shrink-0 text-[#02ece9]" />
                      <span className="truncate text-sm text-white">{doc.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(doc.name);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 hidden lg:flex">
                <span className="text-[#02ece9]">📄</span> Document Analysis Assistant
              </h1>
              <p className="text-gray-400 mb-8 hidden lg:block">
                Upload your documents or enter text to get instant summaries and answers to your questions.
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-6">
                {/* Upload Section */}
                <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-4 lg:p-6">
                  <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed border-gray-700 rounded-lg p-4 lg:p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-[#02ece9] bg-[#1a1a1a]/50' : 'hover:border-gray-600'}`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-sm lg:text-base">
                      {isDragActive
                        ? "Drop your PDF file here"
                        : "Drag & drop a PDF file here, or click to select"}
                    </p>
                    {file && (
                      <p className="mt-2 text-sm text-[#02ece9]">
                        Selected: {file.name}
                      </p>
                    )}
                    {selectedDoc && !file && (
                      <p className="mt-2 text-sm text-[#02ece9]">
                        Using: {selectedDoc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Chat Section */}
                <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-4 lg:p-6 flex flex-col h-[400px] lg:h-[600px]">
                  <h2 className="text-xl font-semibold mb-4">Chat</h2>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.role === "user" 
                            ? "bg-purple-700/90 ml-auto max-w-[85%] lg:max-w-[80%]" 
                            : "bg-[#1a1a1a] max-w-[85%] lg:max-w-[80%]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {loading && (
                      <div className="bg-[#1a1a1a] p-3 rounded-lg animate-pulse">
                        Processing...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question..."
                      className="flex-1 bg-[#1a1a1a] rounded-lg px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#02ece9]"
                      disabled={(!file && !selectedDoc) || loading}
                    />
                    <button
                      onClick={askQuestion}
                      disabled={(!file && !selectedDoc) || loading || !question.trim()}
                      className="bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold px-3 py-2 lg:px-4 lg:py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
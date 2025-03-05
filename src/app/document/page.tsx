"use client";
import React, { useState, useRef, useEffect } from "react";
import { Upload, Send } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function DocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      await processDocument(file);
    },
  });

  const processDocument = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('file', file);

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
    if (!question.trim() || !file) return;

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
          fileName: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      if (!data.answer) {
        throw new Error('No answer received from the server');
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error: any) {
      console.error('Error asking question:', error);
      setError(error.message || 'Error asking question');
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to get answer. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="text-[#02ece9]">📄</span> Document Analysis Assistant
        </h1>
        <p className="text-gray-400 mb-8">
          Upload your documents or enter text to get instant summaries and answers to your questions.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-[#02ece9] bg-gray-800/50' : 'hover:border-gray-600'}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">
                {isDragActive
                  ? "Drop your PDF file here"
                  : "Drag & drop a PDF file here, or click to select"}
              </p>
              {file && (
                <p className="mt-2 text-sm text-[#02ece9]">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col h-[600px]">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === "user" 
                      ? "bg-purple-700 ml-auto max-w-[80%]" 
                      : "bg-gray-800 max-w-[80%]"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="bg-gray-800 p-3 rounded-lg animate-pulse">
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
                placeholder="Ask a question about the document..."
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#02ece9]"
                disabled={!file || loading}
              />
              <button
                onClick={askQuestion}
                disabled={!file || loading || !question.trim()}
                className="bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
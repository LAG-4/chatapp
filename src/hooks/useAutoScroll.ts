import { useEffect, useRef } from 'react';

export function useAutoScroll(messages: any[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messagesEndRef,
    chatContainerRef,
    scrollToBottom
  };
} 
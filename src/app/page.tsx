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
      <Chatbot />
    </div>
  );
}

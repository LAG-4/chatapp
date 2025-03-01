"use client";
import { useEffect } from 'react';
import Chatbot from "../components/Chatbot";


export default function Home() {
  useEffect(() => {
    // Perform the GET request on page launch
    fetch('https://qna-chatbot-0uel.onrender.com/')
      .then(response => response.text()) // assuming the API returns plain text
      .then(data => {
        console.log('API response:', data);
      })
      .catch(error => {
        console.error('Error calling API:', error);
      });
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div className="min-h-screen">
      <Chatbot />
    </div>
  );
}

import React from 'react';

export default function BlogPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-10 m-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3 font-geist-sans">
            Hi, welcome to my blog
          </h1>
          <div className="h-1 w-20 bg-blue-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 font-geist-sans">
            This is the blog subdomain for lagaryan.click
          </p>
        </div>
        
        <div className="prose lg:prose-xl mx-auto font-geist-sans">
          <p>
            This blog is currently under construction. Check back soon for amazing content!
          </p>
        </div>
      </div>
    </div>
  );
} 
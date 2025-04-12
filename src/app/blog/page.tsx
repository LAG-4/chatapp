import React from 'react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/blog-utils';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { BlogPost } from '@/types/blog';

// This is a Server Component that fetches data on the server
export default async function BlogHome() {
  const posts = await getAllBlogPosts();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Welcome to My Blog
        </h1>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
          Thoughts, stories, and ideas on technology, design, and more.
        </p>
      </div>
      
      {posts.length > 0 ? (
        <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
          {posts.map(post => (
            <Link 
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <div className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl">
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
                      <time dateTime={post.date}>
                        {format(new Date(post.date), 'MMMM d, yyyy')}
                      </time>
                      <span>•</span>
                      <span>{post.readingTime.text}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {post.title}
                    </h3>
                    
                    <p className="mt-3 text-base text-gray-500 line-clamp-3">
                      {post.description}
                    </p>
                  </div>
                  
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-900">No blog posts yet</h2>
          <p className="mt-2 text-gray-500">Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
} 
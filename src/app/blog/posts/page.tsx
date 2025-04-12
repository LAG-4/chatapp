import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getPublishedBlogPosts } from '@/lib/blogService';
import { BlogPost } from '@/types/blog';

// Utility function to get unique tags from all posts
function getUniqueTags(posts: BlogPost[]): string[] {
  const allTags = posts.flatMap(post => post.tags || []);
  return [...new Set(allTags)];
}

export default async function PostsPage() {
  // Fetch blog posts from Firebase
  const allPosts = await getPublishedBlogPosts();
  
  // Extract unique tags
  const tags = getUniqueTags(allPosts);
  
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold mb-4">All Blog Posts</h1>
        <p className="text-lg text-gray-600">
          Browse through all the articles and tutorials.
        </p>
      </div>
      
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search posts..." 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm whitespace-nowrap">
            All
          </button>
          {tags.slice(0, 5).map((tag, index) => (
            <button 
              key={index} 
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Blog posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allPosts.length > 0 ? (
          allPosts.map((post) => (
            <Card key={post.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{post.date}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap gap-1">
                  {post.tags && post.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/blog/posts/${post.slug}`}>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    Read Full Article
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <p className="text-gray-500">No posts found. Check back soon!</p>
          </div>
        )}
      </div>
      
      {/* Pagination - We'll implement simple static pagination for now */}
      {allPosts.length > 10 && (
        <div className="flex justify-center gap-2 mt-10">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            Previous
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            1
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            2
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            3
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';
import { Button } from "../../components/ui/button";
import { notFound } from 'next/navigation';
import { getBlogPostBySlug } from '@/lib/blogService';
import Image from 'next/image';

export default async function PostPage({ params }: { params: { slug: string } }) {
  // Fetch blog post from Firebase
  const post = await getBlogPostBySlug(params.slug);
  
  // If post not found, return 404
  if (!post) {
    notFound();
  }
  
  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/blog" className="hover:text-blue-600">Home</Link>
        {' / '}
        <Link href="/blog/posts" className="hover:text-blue-600">Posts</Link>
        {' / '}
        <span>{post.title}</span>
      </div>
      
      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
        <div className="flex items-center text-gray-500 text-sm">
          <span>{post.date}</span>
          <span className="mx-2">•</span>
          <span>By {post.author.name}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-4">
          {post.tags && post.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </header>
      
      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image 
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {/* Post Content - format Markdown content as HTML */}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      
      {/* Post Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link href="/blog/posts">
            <Button className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
              <span>←</span> Back to Posts
            </Button>
          </Link>
          <div className="flex space-x-4">
            <button className="text-gray-500 hover:text-blue-600">
              Share
            </button>
            <button className="text-gray-500 hover:text-blue-600">
              Bookmark
            </button>
          </div>
        </div>
      </div>
    </article>
  );
} 
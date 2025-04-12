import { NextResponse } from 'next/server';
import { createBlogPost } from '@/lib/blogService';

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    
    if (!postData.title || !postData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    const postId = await createBlogPost(postData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Blog post created successfully',
      postId 
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
} 
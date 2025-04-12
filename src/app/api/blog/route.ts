import { NextResponse } from 'next/server';
import { getAllBlogPosts, getPublishedBlogPosts, createBlogPost } from '@/lib/blogService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publishedOnly = searchParams.get('published') === 'true';

  try {
    const posts = publishedOnly 
      ? await getPublishedBlogPosts()
      : await getAllBlogPosts();
    
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const blogData = await request.json();
    
    // Validate required fields
    if (!blogData.title || !blogData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    const id = await createBlogPost(blogData);
    
    return NextResponse.json({ 
      id, 
      message: 'Blog post created successfully' 
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
} 
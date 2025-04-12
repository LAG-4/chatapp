import { NextResponse } from 'next/server';
import { updateBlogPost, getBlogPostById } from '@/lib/blogService';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // Check if post exists
    const existingPost = await getBlogPostById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date().toISOString();
    
    await updateBlogPost(id, updateData);
    
    return NextResponse.json({
      success: true,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
} 
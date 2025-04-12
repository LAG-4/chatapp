import { NextResponse } from 'next/server';
import { uploadCoverImage } from '@/lib/blogService';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;
    
    if (!file || !postId) {
      return NextResponse.json(
        { error: 'File and post ID are required' },
        { status: 400 }
      );
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    const imageUrl = await uploadCoverImage(file, postId);
    
    return NextResponse.json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 
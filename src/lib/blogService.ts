import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { BlogPost } from '@/types/blog';

// Get all blog posts
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const blogRef = collection(db, 'blogs');
    const blogSnapshot = await getDocs(
      query(blogRef, orderBy('date', 'desc'))
    );
    
    return blogSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as BlogPost));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Get published blog posts
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    // Try the optimal query first (with index)
    try {
      const blogRef = collection(db, 'blogs');
      const blogSnapshot = await getDocs(
        query(
          blogRef, 
          where('status', '==', 'Published'),
          orderBy('date', 'desc')
        )
      );
      
      return blogSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as BlogPost));
    } catch (indexError) {
      console.warn('Index still building, falling back to alternative query', indexError);
      
      // Fallback: Get all blog posts and filter in memory
      const blogRef = collection(db, 'blogs');
      const blogSnapshot = await getDocs(blogRef);
      
      const allPosts = blogSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as BlogPost));
      
      // Filter and sort in memory
      return allPosts
        .filter(post => post.status === 'Published')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    return [];
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const blogRef = collection(db, 'blogs');
    const blogSnapshot = await getDocs(
      query(blogRef, where('slug', '==', slug), limit(1))
    );
    
    if (blogSnapshot.empty) {
      return null;
    }
    
    const doc = blogSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

// Get a single blog post by ID
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const docRef = doc(db, 'blogs', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post by ID:', error);
    return null;
  }
}

// Create a new blog post
export async function createBlogPost(post: Omit<BlogPost, 'id'>): Promise<string | null> {
  try {
    const blogRef = collection(db, 'blogs');
    const docRef = await addDoc(blogRef, {
      ...post,
      date: post.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog post:', error);
    return null;
  }
}

// Update a blog post
export async function updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
  try {
    const docRef = doc(db, 'blogs', id);
    await updateDoc(docRef, {
      ...post,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error updating blog post:', error);
    return false;
  }
}

// Delete a blog post
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    // First, get the post to check if it has a cover image
    const post = await getBlogPostById(id);
    
    // Delete the document
    const docRef = doc(db, 'blogs', id);
    await deleteDoc(docRef);
    
    // If post has a cover image, delete it from storage
    if (post && post.coverImage) {
      try {
        // Extract the image path from the URL
        const imagePath = post.coverImage.split('blogs%2F')[1].split('?')[0];
        if (imagePath) {
          const imageRef = ref(storage, `blogs/${imagePath}`);
          await deleteObject(imageRef);
        }
      } catch (storageError) {
        console.error('Error deleting cover image:', storageError);
        // Continue even if image deletion fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

// Upload a cover image for a blog post
export async function uploadCoverImage(file: File, postId: string): Promise<string | null> {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `blogs/${postId}_${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return null;
  }
} 
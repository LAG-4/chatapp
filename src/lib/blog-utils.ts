import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { promises as fsPromises } from 'fs';

const blogsDirectory = path.join(process.cwd(), 'src/content/blogs');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  image: string;
  content: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
}

export async function getBlogSlugs() {
  const files = await fsPromises.readdir(blogsDirectory);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace(/\.md$/, ''));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost> {
  const fullPath = path.join(blogsDirectory, `${slug}.md`);
  const fileContents = await fsPromises.readFile(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  return {
    slug,
    title: data.title,
    description: data.description || '',
    date: data.date || new Date().toISOString().split('T')[0],
    tags: data.tags || [],
    image: data.image || '/images/blog/default.jpg',
    content,
    readingTime: readingTime(content),
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const slugs = await getBlogSlugs();
  const postsPromises = slugs.map(slug => getBlogPostBySlug(slug));
  const posts = await Promise.all(postsPromises);
  
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getRecentBlogPosts(count: number = 3): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.slice(0, count);
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
} 
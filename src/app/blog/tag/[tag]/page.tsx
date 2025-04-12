import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAllBlogPosts, getBlogPostsByTag } from '@/lib/blog-utils';
import { Metadata } from 'next';

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  const tags = new Set<string>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).map(tag => ({ tag }));
}

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  return {
    title: `Posts tagged with "${params.tag}" | My Blog`,
    description: `Browse all blog posts tagged with "${params.tag}"`,
  };
}

export default function BlogTagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const posts = getBlogPostsByTag(tag);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-16">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to all posts
        </Link>
        
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
          Posts tagged with "{tag}"
        </h1>
        <p className="text-lg text-gray-500">
          Found {posts.length} post{posts.length === 1 ? '' : 's'} with this tag
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
                <div className="relative h-48 overflow-hidden">
                  <Image 
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                
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
                      {post.tags.map(postTag => (
                        <span 
                          key={postTag} 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            postTag.toLowerCase() === tag.toLowerCase() 
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {postTag}
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
          <h2 className="text-2xl font-semibold text-gray-900">No blog posts found</h2>
          <p className="mt-2 text-gray-500">There are no posts with the tag "{tag}"</p>
        </div>
      )}
    </div>
  );
} 
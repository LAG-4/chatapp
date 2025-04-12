import { format } from 'date-fns';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getBlogPostBySlug, getBlogSlugs } from '@/lib/blog-utils';
import { Metadata } from 'next';

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map(slug => ({ slug }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  
  return {
    title: `${post.title} | My Blog`,
    description: post.description,
  };
}

// Custom renderers for markdown components
const customRenderers = {
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return !inline ? (
      <div className="code-block-wrapper my-6">
        {language && (
          <div className="code-language-header px-4 py-2 bg-gray-800 text-gray-200 text-xs font-mono rounded-t-lg">
            {language}
          </div>
        )}
        <pre className={className} {...props}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
      <Link 
        href="/blog" 
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-8"
      >
        ← Back to all posts
      </Link>
      
      <div className="prose prose-lg max-w-none">
        <header className="mb-10 not-prose">
          <div className="flex items-center space-x-2 text-sm text-gray-700 mb-3">
            <time dateTime={post.date}>
              {format(new Date(post.date), 'MMMM d, yyyy')}
            </time>
            <span>•</span>
            <span>{post.readingTime.text}</span>
          </div>
          
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            {post.title}
          </h1>
          
          <p className="text-xl text-gray-700 mb-6">
            {post.description}
          </p>
          
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <Link 
                  key={tag} 
                  href={`/blog/tag/${tag}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>
        
        <div className="prose prose-blue prose-lg prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-a:text-blue-600 prose-li:text-gray-800 prose-code:text-gray-800 max-w-none">
          <ReactMarkdown components={customRenderers}>{post.content}</ReactMarkdown>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-gray-200">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to all posts
        </Link>
      </div>
    </article>
  );
} 
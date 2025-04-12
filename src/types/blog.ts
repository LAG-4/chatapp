export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  date: string;
  author: {
    name: string;
    email: string;
    photoURL?: string;
  };
  status: 'Published' | 'Draft';
  tags: string[];
} 
import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import { toast } from 'react-hot-toast';

interface CodeSnippetProps {
  code: string;
  language?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = 'javascript' }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  // Function to get a more readable language name
  const getDisplayLanguage = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'python': 'Python',
      'bash': 'Bash',
      'sh': 'Shell',
      'json': 'JSON',
      'md': 'Markdown',
      'markdown': 'Markdown',
      'text': 'Plain Text'
    };
    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  // Function to handle code copy
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        toast.success('Code copied to clipboard!', {
          duration: 2000,
          position: 'top-center'
        });
      })
      .catch(() => {
        toast.error('Failed to copy code', {
          duration: 2000,
          position: 'top-center'
        });
      });
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2">
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-gray-700/50 hover:bg-gray-600 transition-colors text-gray-300"
          title="Copy code"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy code
        </button>
      </div>
      <pre className="rounded-lg bg-[#1e1e1e] p-4 overflow-x-auto mt-6">
        <div className="absolute top-0 right-0 -mt-2 mr-4 px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
          {getDisplayLanguage(language)}
        </div>
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeSnippet; 
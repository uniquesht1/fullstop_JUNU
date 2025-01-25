
import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

const MessageContent = ({ content, isUser }) => (
  <ReactMarkdown
    components={{
      code: CodeBlock,
      a: ({ node, ...props }) => (
        <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />
      ),
      ul: ({ node, ...props }) => (
        <ul {...props} className="list-disc list-inside my-2" />
      ),
      ol: ({ node, ...props }) => (
        <ol {...props} style={{ listStyleType: 'decimal', margin: '0 0 0 1rem' }} />
      ),
      li: ({ node, ...props }) => (
        <li {...props} style={{ display: 'list-item', listStyleType: 'inherit' }} />
      ), // Style headings
      h1: ({ node, ...props }) => (
        <h1 {...props} className="text-xl font-bold my-2" />
      ),
      h2: ({ node, ...props }) => (
        <h2 {...props} className="text-lg font-bold my-2" />
      ),
      h3: ({ node, ...props }) => (
        <h3 {...props} className="text-md font-bold my-2" />
      ),
      p: ({ node, ...props }) => (
        <p {...props} className="my-2" />
      ),
      blockquote: ({ node, ...props }) => (
        <blockquote {...props} className="border-l-4 border-gray-300 pl-4 my-2 italic" />
      ),
    }}
    className={`prose ${isUser ? 'prose-invert' : 'prose-gray'} max-w-none`}
  >
    {content}
  </ReactMarkdown>
);

export default MessageContent;

import React from 'react';

const CodeBlock = ({ className, children }) => {
  const language = className ? className.replace('language-', '') : '';
  return (
    <div className="relative rounded-md bg-gray-800 p-4 my-2">
      <div className="absolute top-2 right-2 text-xs text-gray-400">{language}</div>
      <pre className="text-sm overflow-x-auto text-gray-200">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
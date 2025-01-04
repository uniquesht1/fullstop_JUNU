import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const TypingIndicator = () => (
  <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg w-16">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

// Custom renderer for code blocks
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

const MessageContent = ({ content, isUser }) => (
  <ReactMarkdown
    components={{
      code: CodeBlock,
      // Style links
      a: ({ node, ...props }) => (
        <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />
      ),
      // Style lists
      ul: ({ node, ...props }) => (
        <ul {...props} className="list-disc list-inside my-2" />
      ),
      ol: ({ node, ...props }) => (
        <ol {...props} className="list-decimal list-inside my-2" />
      ),
      // Style headings
      h1: ({ node, ...props }) => (
        <h1 {...props} className="text-xl font-bold my-2" />
      ),
      h2: ({ node, ...props }) => (
        <h2 {...props} className="text-lg font-bold my-2" />
      ),
      h3: ({ node, ...props }) => (
        <h3 {...props} className="text-md font-bold my-2" />
      ),
      // Style paragraphs
      p: ({ node, ...props }) => (
        <p {...props} className="my-2" />
      ),
      // Style blockquotes
      blockquote: ({ node, ...props }) => (
        <blockquote {...props} className="border-l-4 border-gray-300 pl-4 my-2 italic" />
      ),
    }}
    className={`prose ${isUser ? 'prose-invert' : 'prose-gray'} max-w-none`}
  >
    {content}
  </ReactMarkdown>
);

const LandingPage = ({ onStart }) => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-500">
    <div className="text-center space-y-6 p-8">
      <h1 className="text-4xl font-bold text-gray-800">Gemini Chat</h1>
      <p className="text-xl text-gray-600">Start a conversation with Gemini AI</p>
      <button 
        onClick={onStart}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Start Chatting
      </button>
    </div>
  </div>
);

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [landingOpacity, setLandingOpacity] = useState(1);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  const handleStart = () => {
    setLandingOpacity(0);
    setTimeout(() => {
      setShowLanding(false);
      setMessages([{ 
        id: 1, 
        text: "Hello! I'm Gemini. I can help you with various tasks. Try asking me something! \n\nI can help with:\n- Writing and analysis\n- Code and technical questions\n- Math and calculations\n- General knowledge", 
        sender: "bot" 
      }]);
    }, 500);
  };

  const callGeminiAPI = async (prompt) => {
    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error('Error calling Gemini API:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (inputValue.trim() && !isSubmitting) {
      setIsSubmitting(true);
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: inputValue.trim(),
        sender: "user"
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);
      
      try {
        // Get response from Gemini
        const response = await callGeminiAPI(userMessage.text);
        
        setIsTyping(false);
        const botMessage = {
          id: Date.now() + 1,
          text: response,
          sender: "bot"
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        setError("Failed to get response from Gemini. Please try again.");
        setIsTyping(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <>
      {showLanding && 
        <LandingPage 
          onStart={handleStart} 
          style={{ opacity: landingOpacity }}
        />
      }
      
      <div className="flex flex-col h-screen max-w-2xl mx-auto">
        <div className="bg-white border-b p-4">
          <h1 className="text-xl font-semibold">Gemini Chat</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <MessageContent 
                  content={message.text} 
                  isUser={message.sender === 'user'} 
                />
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-center p-2">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatUI;
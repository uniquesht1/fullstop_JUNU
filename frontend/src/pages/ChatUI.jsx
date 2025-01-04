import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react'; // Import Sparkles icon
import TypingIndicator from '../components/TypingIndicator';
import MessageContent from '../components/MessageContent';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
    setMessages([{ 
      id: 1, 
      text: "Hello! I'm Gemini. I can help you with various tasks. Try asking me something! \n\nI can help with:\n- Writing and analysis\n- Code and technical questions\n- Math and calculations\n- General knowledge", 
      sender: "bot" 
    }]);
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

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion); // Set the suggestion as the input value
    inputRef.current.focus(); // Focus the input field
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gradient-to-b from-blue-50 to-white relative">
      {/* Faded background image */}
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-20 z-0"
        style={{ 
          backgroundImage: `url(robo.svg)`,
          backgroundSize: '30%', // Adjust the size of the background image
          backgroundPosition: 'center 50%', // Position the image at the top
        }}
      ></div>

      {/* Upper flex container (logo container) with transparent background and no shadow */}
      <div className="p-2 flex items-center justify-between mx-4 my-2 rounded-lg relative z-10">
        <img src="logo.svg" className="w-32 h-auto" alt="Logo" /> {/* Reduced logo size */}
        <span className="text-lg font-extrabold text-[#87B5E5]">Chat</span> {/* Reduced text size */}
      </div>

      {/* Chat messages container without border */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mx-4 my-2 relative z-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-800 shadow-md'
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
          <div className="text-red-500 text-center p-2 border border-gray-200 rounded-lg">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Lower flex container (suggestions and input form) */}
      <div className="bg-white p-4 shadow-lg mx-4 my-2 rounded-lg relative z-10 shadow-top">
        {/* Suggestions heading with sparkle icon */}
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Suggestions</h3>
          <Sparkles className="w-5 h-5" style={{ color: '#87B5E5' }} />

        </div>

        {/* Horizontally scrollable suggestions container with hidden scrollbar */}
        <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {[
            "नेपाली नागरिकता कसरी प्राप्त गर्न सकिन्छ?",
            "नागरिकता फारम कहाँ भर्न सकिन्छ?",
            "नागरिकताको लागि आवश्यक कागजात के के छन्?",

            "नागरिकता प्रक्रियामा कति समय लाग्छ?",
            "नागरिकता रिन्यु गर्न कति खर्च लाग्छ?",
            "नागरिकता गुमाएको अवस्थामा के गर्ने?",
            "नागरिकता फारम भर्ने प्रक्रिया के हो?",
            "नागरिकता प्रमाणपत्र कहाँ बनाउन सकिन्छ?"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
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
        </form>
      </div>

      {/* Custom CSS for shadow-top and scrollbar */}
      <style>
        {`
          .shadow-top {
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Hide scrollbar for Chrome, Safari, and Opera */
          }
          .scrollbar-hide {
            -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */
            scrollbar-width: none; /* Hide scrollbar for Firefox */
          }
        `}
      </style>
    </div>
  );
};

export default ChatUI;
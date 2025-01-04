import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import TypingIndicator from '../components/TypingIndicator';
import MessageContent from '../components/MessageContent';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const floatingContainerRef = useRef(null);
  const [bottomPadding, setBottomPadding] = useState(120);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  useEffect(() => {
    const updatePadding = () => {
      if (floatingContainerRef.current) {
        const height = floatingContainerRef.current.offsetHeight;
        console.log("Floating Container Height:", height); // Debug here
        setBottomPadding(height); // Add extra space
      }
    };

    updatePadding();
    window.addEventListener("resize", updatePadding);
    return () => window.removeEventListener("resize", updatePadding);
  }, []);

  const handleNavigate = () => {
    console.log("Navigating to voice chat...");
    navigate('/voice'); // Navigate to /voice
  };
  
const handleStart = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm Gemini. I can help you with various tasks. Try asking me something! \n\nI can help with:\n- Writing and analysis\n- Code and technical questions\n- Math and calculations\n- General knowledge",
        sender: "bot",
      },
    ]);
  };

  const callGeminiAPI = async (prompt) => {
    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
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
      setShowSuggestions(false);

      const userMessage = {
        id: Date.now(),
        text: inputValue.trim(),
        sender: "user",
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);

      try {
        const response = await callGeminiAPI(userMessage.text);

        setIsTyping(false);
        const botMessage = {
          id: Date.now() + 1,
          text: response,
          sender: "bot",
        };
        setMessages((prev) => [...prev, botMessage]);
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

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    inputRef.current.focus();
  };

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #90bbe8, #FFFFFF)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '70%',
          maxWidth: '800px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
          position: 'relative',
        }}
      >
        {/* Background Images */}
        <div
          className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-20 z-0"
          style={{
            backgroundImage: "url('/robo.svg')",
            backgroundSize: '30%',
            backgroundPosition: 'center 50%',
          }}
        ></div>


          <div
          className="absolute bg-no-repeat bg-contain opacity-20 z-0"
          style={{ 
            backgroundImage: 'url(chat.svg)',
            backgroundSize: '20%', // Adjust the size of the image
            width: '300px', // Set a fixed width
            height: '100px', // Set a fixed height
            top: '30%', // Position at the top
            left: '100%', // Position at the right
          }}
        ></div>
        
        
        <div
          className="absolute bg-no-repeat bg-contain opacity-20 z-0"
          style={{ 
            backgroundImage: 'url(chat.svg)',
            backgroundSize: '20%', // Adjust the size of the image
            width: '200px', // Set a fixed width
            height: '100px', // Set a fixed height
            top: '30%', // Position at the top
            right: '70%', // Position at the right
          }}
        ></div>

  

        
        <div
          className="absolute bg-no-repeat bg-contain opacity-20 z-0"
          style={{ 
            backgroundImage: 'url(chat.svg)',
            backgroundSize: '50%', // Adjust the size of the image
            width: '200px', // Set a fixed width
            height: '100px', // Set a fixed height
            top: '60%', // Position at the top
            left: '90%', // Position at the right
          }}
          ></div>

        <div className="p-2 flex items-center justify-between mx-5 my-2 rounded-lg relative z-10">
        <Link to="/">
            <img src="/logo.svg" className="w-32 h-auto cursor-pointer" alt="Logo" />
          </Link>
          <button
  onClick={handleNavigate} // Handle click to navigate
  className="absolute top-7 right-6 p-3 px-4 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
  style={{ border: "2px solid #90bbe8" }}
>
  <span className="text-[#8ab7e2] font-black pr-6 text-xl">माइक्रोफोन प्रयोग गर्नुहोस्</span>

  <FaArrowRight className="text-[#8ab7e2]" size={20} />
</button>

        </div>

        <div
  className="flex-1 overflow-y-auto p-4 space-y-4 mx-4 my-2 relative z-10"
  style={{
    paddingBottom: `${bottomPadding}px`,
    scrollbarWidth: 'none', /* For Firefox */
    msOverflowStyle: 'none', /* For Internet Explorer and Edge */
     maxHeight: '70vh',
  }}
  
>
  {messages.map((message) => (
    <div
      key={message.id}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          message.sender === 'user'
            ? 'text-white shadow-md'
            : 'bg-white text-gray-800 shadow-md'
        }`}
        style={{
          backgroundColor: message.sender === 'user' ? '#515AC3' : '',
        }}
      >
        <MessageContent content={message.text} isUser={message.sender === 'user'} />
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


        {/* Input and Suggestions */}
        <div
          ref={floatingContainerRef}
          className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[65%] max-w-[750px] bg-white p-4 shadow-lg rounded-lg z-20 backdrop-blur-sm bg-opacity-95 ${
            showSuggestions ? 'pb-4' : 'pb-2'
          }`}
        >
          {showSuggestions && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-700">सुझावहरू</h3>
                <Sparkles className="w-5 h-5" style={{ color: '#87B5E5' }} />
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                  "नेपाली नागरिकता कसरी प्राप्त गर्न सकिन्छ?",
                  "नागरिकता फारम कहाँ भर्न सकिन्छ?",
                  "नागरिकताको लागि आवश्यक कागजात के के छन्?",
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
            </>
          )}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="टाइप गर्नुहोस्..."
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
    </div>
  );
};

export default ChatUI;
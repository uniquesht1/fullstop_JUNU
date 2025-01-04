
import React from 'react';

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

export default LandingPage;
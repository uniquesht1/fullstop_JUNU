import React from "react";

const ChatbotUI = () => {
  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-md">
        <div className="flex items-center justify-center w-1/2 font-bold text-blue-600 text-xl">
          <img src="logo.svg"></img>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Welcome Section */}
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
          <h1 className="text-3xl font-semibold">Welcome!</h1>
          <p className="text-lg text-gray-500 mt-2">How can I help you?</p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center px-4 pb-6">
          <div className="flex items-center w-full max-w-md border rounded-lg shadow-sm bg-white px-4 py-2">
            <input
              type="text"
              placeholder="Type your query here..."
              className="flex-grow outline-none text-base text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M15 11a4 4 0 10-8 0 4 4 0 008 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotUI;

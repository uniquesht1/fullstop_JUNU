

import React from 'react'
import { IoSearchSharp } from "react-icons/io5";

const ChatbotUI = () => {
  return (
    <div>
      <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Main Content */}
      <div className="flex flex-col flex-1  h-full items-center ">

        
        <div className="flex items-center justify-between w-full px-4 py-2 flex-col h-5/6">
        <img src="logo.svg" className="w-28 h-auto "></img>
        <div className="flex flex-col items-center justify-center flex-1 text-center w-full ">
            <img src="robo.svg" className="w-auto h-[25svh]"></img>
          <img src="namaste.svg" className="w-28 ml-[4svh] h-auto "></img>
          <p className="text-lg text-gray-500 mt-2">म तपाईंलाई कसरी सहायता गर्न सक्छु?</p>
        </div>
        <div className="flex items-center space-x-14 h-1/5">
            <button className="border-gray-300  border-2 text-black px-4 py-2 rounded-2xl  w-auto h-8 flex items-center justify-center"> citizenship
        </button>
        <button className="border-gray-300  border-2 text-black px-4 py-2 rounded-2xl  w-auto h-8 flex items-center justify-center"> citizenship
        </button>
        <button className="border-gray-300  border-2 text-black px-4 py-2 rounded-2xl  w-auto h-8 flex items-center justify-center"> citizenship
        </button>
        <button className="border-gray-300  border-2 text-black px-4 py-2 rounded-2xl  w-auto h-8 flex items-center justify-center"> citizenship
        </button>
        </div>
        </div>
      
        
    


        {/* Search Bar */}
        <div className="flex justify-center items-center px-4  w-full">
          <div className="flex items-center w-full  border rounded-3xl shadow-sm bg-white px-4 py-2 mx-10">
            <input
              type="text"
              placeholder="Type your query here..."
              className="flex-grow outline-none text-base text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              className="ml-2 p-2 bg-[#6abbee] text-white rounded-full hover:bg-blue-500"
            >
             <IoSearchSharp />
                
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  )
}

export default ChatbotUI



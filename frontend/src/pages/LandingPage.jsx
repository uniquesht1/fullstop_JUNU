

import React from 'react'
import { Link } from 'react-router-dom'
import { FaKeyboard, FaMicrophone } from "react-icons/fa";


const LandingPage = () => {
  return (
    <div>
      <div className="flex h-screen bg-custom-gradient text-gray-900">
      {/* Main Content */}
      <div className="flex flex-col flex-1  items-center mt-8">

        
       
        <img src="logo.svg" className="w-60 h-auto "></img>
        <div className="flex  items-center justify-center  text-center w-full h-auto p-5 gap-20">
        <Link 
        to="/chat"
        className="flex flex-col items-center justify-center w-44 h-44  bg-[#8ab7e2] text-white rounded-full   hover:border-[#adf3f6] border-gray-300 border-4  transition">
        <FaKeyboard className="w-8 h-8 mb-1" />
        <span className="text-sm  font-semibold">टाइप गर्नुहोस्</span>
      </Link>
        <div className='flex items-center justify-center flex-col'>
            <img src="robo2.svg" className="w-auto h-[30svh] -ml-4"></img>
          <img src="namaste.svg" className="w-24 mt-5  h-auto "></img>
          <p className="text-lg text-gray-500 ">म तपाईंलाई कसरी सहायता गर्न सक्छु?</p>
          </div>
          <Link 
        to="/voice"
        className="flex flex-col items-center justify-center w-44 h-44  bg-[#8ab7e2] text-white rounded-full   hover:border-[#adf3f6] border-gray-300 border-4  transition">
        <FaMicrophone className="w-8 h-8 mb-1" />
        <span className="text-sm mt-2 font-semibold">रेकर्ड गर्नुहोस्</span>
      </Link>
        </div>
       
      
        {/* Search Bar */}
        {/* <div className="flex justify-center items-center px-4  w-full">
          <div className="flex items-center w-full  border rounded-3xl shadow-sm bg-white px-4 py-2 mx-10">
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
        </div> */}

      </div>
    </div>
    </div>
  )
}

export default LandingPage


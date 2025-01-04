import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage"
import ChatUI from "./pages/ChatUI"
import VoiceUI from "./pages/VoiceUI"

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="chat" element={<ChatUI />} />
      <Route path="voice" element={<VoiceUI />} />
    </Routes>
  );
}

export default App;

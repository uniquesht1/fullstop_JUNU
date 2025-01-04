import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaTimes, FaDownload } from 'react-icons/fa';

const VoiceUI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [sphereGradient, setSphereGradient] = useState('radial-gradient(circle, var(--sphere-color-start), var(--sphere-color-end))');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const gradientAnimationFrameRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setShowNotification(true);
      };
      mediaRecorderRef.current.start();
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyzeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const volume = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
    const gradientPosition = (volume / 255).toFixed(2);
    const gradient = `radial-gradient(circle, rgba(128, 0, 128, ${gradientPosition}) 20%, rgba(75, 0, 130, ${gradientPosition}) 100%)`;
    setSphereGradient(gradient);
            if (isRecording) {
      gradientAnimationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    cancelAnimationFrame(gradientAnimationFrameRef.current);
    setSphereGradient('radial-gradient(circle, var(--sphere-color-start), var(--sphere-color-end))');
  };

  const handleMicButtonClick = () => setIsRecording(true);
  const handleStopButtonClick = () => setIsRecording(false);

  const handleDownload = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'recording.webm';
      link.click();
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, var(--background-start), var(--background-end))',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* CSS Variables for Colors */}
      <style>
        {`
          :root {
            --background-start: #90bbe8;
            --background-end: #FFFFFF;
            --sphere-color-start:rgb(111, 156, 204);
            --sphere-color-end:rgb(68, 143, 224);
          }
        `}
      </style>

      {/* Main Icon (Sphere) */}
      <div
        className="w-60 h-60 rounded-full"
        style={{
          background: sphereGradient,
          boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5), 0 5px 15px rgba(0,0,0,0.5)',
          transition: 'background 0.3s ease',
        }}
        onAnimationStart={(e) => e.stopPropagation()}
      ></div>

      {/* Rotation Animation */}
      <style>
        {`
          .rotating-sphere {
            animation: rotate 10s infinite linear;
          }
          @keyframes rotate {
            from { transform: rotateY(0deg); }
            to { transform: rotateY(360deg); }
          }
        `}
      </style>

      {/* Notifications */}
      {showNotification && (
        <button
          className="absolute top-5 right-5 flex items-center bg-gray-200 p-2 rounded-full hover:bg-gray-300"
          onClick={handleDownload}
        >
          <FaDownload className="text-red-500 text-2xl cursor-pointer" />
          <span className="ml-2 text-black cursor-pointer">Download recent clip</span>
          <FaTimes className="ml-2" onClick={() => setShowNotification(false)} />
        </button>
      )}

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center space-x-10">
        <button
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
          onClick={handleMicButtonClick}
        >
          <FaMicrophone />
        </button>
        <button
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
          onClick={handleStopButtonClick}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default VoiceUI;
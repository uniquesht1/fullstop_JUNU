import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaMicrophone,
  FaTimes,
  FaArrowRight,
  FaDownload,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import Waveform from "../components/Waveform"; // Import the Waveform component
import {Link} from 'react-router-dom';

const VoiceUI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState(new Array(200).fill(50));
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const previousDataRef = useRef(new Array(200).fill(50));
  const waveformRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  

  // Cleanup function
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    const processedData = Array.from(dataArray).map((value, index) => {
      const newValue = ((value - 128) / 128) * 50 + 50;
      const previousValue = previousDataRef.current[index] || 50;
      return previousValue + (newValue - previousValue) * 0.3;
    });

    previousDataRef.current = processedData;
    setWaveformData(processedData);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Initialize audio context
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Initialize media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const newAudioUrl = URL.createObjectURL(blob);
        setAudioUrl(newAudioUrl);
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      analyzeAudio();
    } catch (err) {
      setError(err.message);
      console.error("Error starting recording:", err);
    }
  }, [analyzeAudio, cleanup]);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      cleanup();
    }
  }, [isRecording, startRecording, cleanup]);

  const captureWaveform = useCallback(async () => {
    if (!waveformRef.current) return;

    try {
      const canvas = await html2canvas(waveformRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const webpUrl = canvas.toDataURL("image/webp", 0.9);
      const link = document.createElement("a");
      link.href = webpUrl;
      link.download = "waveform.webp";
      link.click();
    } catch (err) {
      setError("Failed to capture waveform");
      console.error("Error capturing waveform:", err);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: "linear-gradient(to bottom, #90bbe8, #FFFFFF)" }}
    >
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      <div className="pl-6 absolute top-0 left-0 items-start rounded-lg z-10">
          <Link to="/">
            <img src="/logo.svg" className="w-32 h-auto cursor-pointer" alt="Logo" />
          </Link>
      </div>
      <Link 
        to="/chat"
        className="absolute top-7 right-6 p-3 px-4 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        style={{ border: "2px solid #90bbe8" }}
      >
        <span className="text-blue-400 font-bold pr-6 text-xl">Switch to Chat</span>
        <FaArrowRight className="text-blue-400" size={20} />
      </Link>
      {/* Circle Container */}
      <div className="relative flex items-center justify-center w-72 h-72 rounded-full border-4 border-blue-400">
        <Waveform waveformData={waveformData} waveformRef={waveformRef} />
        {/* Robo SVG placed at the center */}
        <div className="absolute flex items-center justify-center w-full h-full">
          <img src="/robo.svg" alt="robo" className="w-52 h-auto pr-6" />
        </div>
      </div>
      {/* Recording and Stop Buttons */}
      <div className="flex space-x-4 mt-8">
        <button
          className="p-3 bg-blue-400 hover:bg-blue-500 rounded-full shadow-lg transition-all duration-300"
          onClick={() => setIsRecording(!isRecording)}
        >
          <FaMicrophone size={24} className="text-white justi" />
        </button>

        {isRecording && (
          <button
            className="p-3 bg-red-400 hover:bg-red-500 rounded-full shadow-lg transition-all duration-300"
            onClick={() => setIsRecording(false)}
          >
            <FaTimes size={24} className="text-white" />
          </button>
        )}

        {/* Download Button */}
        {audioUrl && !isRecording && (
          <a
            href={audioUrl}
            download="recording.webm"
            className="p-3 bg-green-400 hover:bg-green-500 rounded-full shadow-lg transition-all duration-300"
          >
            <FaDownload size={24} className="text-white" />
          </a>
        )}
      </div>
    </div>
  );
};

export default VoiceUI;

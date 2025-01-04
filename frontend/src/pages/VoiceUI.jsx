import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaMicrophone, FaTimes, FaArrowRight, FaDownload, FaPlay, FaStop } from "react-icons/fa";
import { Link } from "react-router-dom";
import Waveform from "../components/Waveform";

const VoiceUI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState(new Array(200).fill(50));
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const previousDataRef = useRef(new Array(200).fill(50));
  const waveformRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null); // Ref for the <audio> element

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

      // Initialize MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : null;

      if (!mimeType) {
        throw new Error("No supported mimeType for audio recording");
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const wavBlob = await convertToWav(blob); // Convert to WAV
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      analyzeAudio();
    } catch (err) {
      setError(err.message);
      console.error("Error starting recording:", err);
    }
  }, [analyzeAudio, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const convertToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Encode audio buffer to WAV
    const wavBlob = encodeWav(audioBuffer);
    return wavBlob;
  };

  const encodeWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataLength = audioBuffer.length * numChannels * 2; // 2 bytes per sample

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, "RIFF"); // RIFF header
    view.setUint32(4, 36 + dataLength, true); // File size
    writeString(view, 8, "WAVE"); // WAVE format
    writeString(view, 12, "fmt "); // fmt chunk
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    writeString(view, 36, "data"); // data chunk
    view.setUint32(40, dataLength, true); // data chunk size

    // Write audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i])); // Clamp sample
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); // Convert to 16-bit
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = audioUrl;
    a.download = "recording.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

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
  <span className="text-[#8ab7e2] font-black pr-6 text-xl">च्याटमा जानुहोस्</span>
        <FaArrowRight className="text-[#8ab7e2]" size={20} />
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
          {isRecording ? <FaTimes size={24} className="text-white" /> : <FaMicrophone size={24} className="text-white" />}
        </button>

        {audioUrl && !isRecording && (
          <>
            <button
              className="p-3 bg-green-400 hover:bg-green-500 rounded-full shadow-lg transition-all duration-300"
              onClick={handlePlay}
              disabled={isPlaying}
            >
              <FaPlay size={24} className="text-white" />
            </button>
            <button
              className="p-3 bg-red-400 hover:bg-red-500 rounded-full shadow-lg transition-all duration-300"
              onClick={handleStop}
              disabled={!isPlaying}
            >
              <FaStop size={24} className="text-white" />
            </button>
            <button
              className="p-3 bg-purple-400 hover:bg-purple-500 rounded-full shadow-lg transition-all duration-300"
              onClick={handleDownload}
            >
              <FaDownload size={24} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Audio Player */}
      {audioUrl && !isRecording && (
        <div className="mt-4">
          <audio ref={audioRef} src={audioUrl} controls />
        </div>
      )}
    </div>
  );
};

export default VoiceUI;
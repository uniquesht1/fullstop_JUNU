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
  const [responseAudio, setResponseAudio] = useState(null);
  // const [transcriptionHistory, setTranscriptionHistory] = useState([]);

  const responseAudioContextRef = useRef(null);
  const responseAnalyserRef = useRef(null);
  const responseSourceRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const previousDataRef = useRef(new Array(200).fill(50));
  const waveformRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null);
  const responseAudioRef = useRef(null);

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
    if (responseAudioContextRef.current?.state !== "closed") {
      responseAudioContextRef.current?.close();
    }

    if (responseAudio) {
      URL.revokeObjectURL(responseAudio);
    }
  }, [audioUrl, responseAudio]);


  const analyzeResponseAudio = useCallback(() => {
    if (!responseAnalyserRef.current) return;

    const dataArray = new Uint8Array(responseAnalyserRef.current.frequencyBinCount);
    responseAnalyserRef.current.getByteTimeDomainData(dataArray);

    const processedData = Array.from(dataArray).map((value, index) => {
      const newValue = ((value - 128) / 128) * 50 + 50;
      const previousValue = previousDataRef.current[index] || 50;
      return previousValue + (newValue - previousValue) * 0.3;
    });

    previousDataRef.current = processedData;
    setWaveformData(processedData);

    animationFrameRef.current = requestAnimationFrame(analyzeResponseAudio);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  useEffect(() => {
    if (responseAudio) {
      responseAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      responseAnalyserRef.current = responseAudioContextRef.current.createAnalyser();
      responseAnalyserRef.current.fftSize = 512;
      responseAnalyserRef.current.smoothingTimeConstant = 0.8;

      const audio = new Audio(responseAudio);
      audio.addEventListener('play', () => {
        responseSourceRef.current = responseAudioContextRef.current.createMediaElementSource(audio);
        responseSourceRef.current.connect(responseAnalyserRef.current);
        responseAnalyserRef.current.connect(responseAudioContextRef.current.destination);
        analyzeResponseAudio();
      });

      audio.addEventListener('ended', () => {
        cancelAnimationFrame(animationFrameRef.current);
        setWaveformData(new Array(200).fill(50));
      });

      audio.play();
    }

  }, [responseAudio, analyzeResponseAudio]);
  const handleSTT = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    try {
      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // 'Content-Type': 'multipart/form-data'
        }
      });
      if (!sttResponse.ok) throw new Error('STT API failed');
      const response = await sttResponse.json();
      const text = response.text;

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "mode": "voice",
          "user_input": text,
          "history": []
        })
      });
      if (!chatResponse.ok) throw new Error('Chat API failed');
      const { answer } = await chatResponse.json();

      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: answer })
      });
      if (!ttsResponse.ok) throw new Error('TTS API failed');

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (responseAudio) {
        URL.revokeObjectURL(responseAudio);
      }

      setResponseAudio(audioUrl);

      // const audio = new Audio(audioUrl);
      // audio.play();
    } catch (err) {
      setError("API Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

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
      setResponseAudio(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const wavBlob = await convertToWav(blob);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
        handleSTT(wavBlob);
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
    return encodeWav(audioBuffer);
  };

  const encodeWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataLength = audioBuffer.length * numChannels * 2;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
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
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-gradient-to-b from-[#90bbe8] to-white">
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
        className="absolute top-7 right-6 p-3 px-4 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border-2 border-[#90bbe8]"
      >
        <span className="text-[#8ab7e2] font-black pr-6 text-xl">च्याटमा जानुहोस्</span>
        <FaArrowRight className="text-[#8ab7e2]" size={20} />
      </Link>

      <div className="relative flex items-center justify-center w-72 h-72 rounded-full border-4 border-blue-400">
        <Waveform waveformData={waveformData} waveformRef={waveformRef} />
        <div className="absolute flex items-center justify-center w-full h-full">
          <img src="/robo.svg" alt="robo" className="w-52 h-auto pr-6" />
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        <button
          className="p-3 bg-blue-400 hover:bg-blue-500 rounded-full shadow-lg transition-all duration-300"
          onClick={() => setIsRecording(!isRecording)}
          disabled={isProcessing}
        >
          {isRecording ? (
            <FaTimes size={24} className="text-white" />
          ) : (
            <FaMicrophone size={24} className="text-white" />
          )}
        </button>
      </div>

      {audioUrl && !isRecording && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Your Message:</h3>
          <audio ref={audioRef} src={audioUrl} controls />
        </div>
      )}

      {responseAudio && !isRecording && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <audio ref={responseAudioRef} src={responseAudio} controls />
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 text-blue-600 font-semibold">
          Processing your message...
        </div>
      )}
    </div>
  );
};

export default VoiceUI;
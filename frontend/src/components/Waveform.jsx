import React from "react";

const Waveform = ({ waveformData, waveformRef }) => {
  return (
    <div ref={waveformRef} className="absolute inset-0">
      <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Waveform Path with Reduced Opacity */}
        <path
          d={`M 0,50 ${waveformData
            .map((value, index) => `L ${index},${value}`)
            .join(" ")}`}
          fill="none"
          stroke="#BEE3F8"
          strokeWidth="1"
          opacity="0.4" // Reduced transparency
        />
        <path
          d={`M 0,50 ${waveformData
            .map((value, index) => `L ${index},${value}`)
            .join(" ")}`}
          fill="none"
          stroke="#90BBE8"
          strokeWidth="2"
          filter="url(#glow)"
          opacity="0.6" // Reduced transparency
        />
      </svg>
    </div>
  );
};

export default Waveform;

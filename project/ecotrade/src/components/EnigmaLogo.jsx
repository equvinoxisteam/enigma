import React from 'react';

const EnigmaLogo = ({ size = 32, showText = true, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <img
      src="/enigma-logo.svg"
      alt="Enigma"
      className="object-contain flex-shrink-0"
      style={{ height: size, width: size }}
    />
    {showText && (
      <span className="font-bold tracking-tight text-[#4881F8]" style={{ fontSize: size * 0.55 }}>
        Enigma
      </span>
    )}
  </div>
);

export default EnigmaLogo;

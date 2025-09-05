import React from 'react';

const PourIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Tap Handle */}
    <path d="M13 3v2" />
    <path d="M15 5h-4" />
    
    {/* Tap Body & Spout */}
    <path d="M13 5v4.3c0 1-.7 1.7-1.7 1.7H9" />
    
    {/* Wall Mount/pipe */}
    <path d="M17 5.5a4.5 4.5 0 0 1-4.5 4.5" />
    <path d="M17 5.5H13" />

    {/* Beer Glass */}
    <path d="M7 12h10l-1.5 9h-7L7 12z" />
    
    {/* Beer inside glass */}
    <path d="M7.5 18h9" />
  </svg>
);

export default PourIcon;
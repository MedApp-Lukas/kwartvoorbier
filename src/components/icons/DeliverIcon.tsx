import React from 'react';

const DeliverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    {/* Beer Glass */}
    <path d="M8 5h8l-1.5 9h-5L8 5Z" />

    {/* Foam */}
    <path d="M8 5a4 4 0 0 1 8 0" />

    {/* Tray */}
    <path d="M2 21h20" />
    <path d="M4 21l-1-4h18l-1 4" />
  </svg>
);

export default DeliverIcon;
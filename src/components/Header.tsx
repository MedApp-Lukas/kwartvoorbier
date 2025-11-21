import React from 'react';
import Kerstmuts from '../assets/kerstmuts.png'; 

interface HeaderProps {
    isChristmasThemeEnabled: boolean;
}

const Header: React.FC<HeaderProps> = ({ isChristmasThemeEnabled }) => {
    
  const ErContent = isChristmasThemeEnabled ? (
    <span className="relative inline-block">
      r
      <span 
        className="absolute"
        style={{ 
          top: '-35px', 
          right: '-35px', 
          width: '60px',    
          height: '60px',   
          transform: 'rotate(15deg)', 
          zIndex: 20, 
        }}
      >
        <img 
            src={Kerstmuts} 
            alt="Kerstmuts" 
            className="w-full h-full object-contain"
        />
      </span>
    </span>
  ) : (
    <span className="inline-block">r</span>
  );

  return (
    <header className="text-center py-8">
      <h1 className="text-5xl md:text-6xl font-bold text-purple-900 tracking-tighter">
        kwartvoorbi.e
        {ErContent}
      </h1>
      <p className="text-purple-700 mt-2 text-lg">Het is bijna tijd voor de borrel!</p>
    </header>
  );
};

export default Header;
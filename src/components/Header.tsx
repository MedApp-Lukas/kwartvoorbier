
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-8">
      <h1 className="text-5xl md:text-6xl font-bold text-amber-900 tracking-tighter">
        kwartvoorbi.er
      </h1>
      <p className="text-amber-700 mt-2 text-lg">Het is bijna tijd voor de borrel!</p>
    </header>
  );
};

export default Header;

// In src/features/orders/RouletteWheel.tsx

import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';

interface RouletteWheelProps {
  participants: string[];
}

// Stap 1: Een functie om een unieke "seed" te maken voor vandaag
// Deze seed is voor iedereen hetzelfde, zolang de deelnemers en de datum hetzelfde zijn.
const createDailySeed = (participants: string[]): number => {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  
  // Sorteer de namen zodat de volgorde geen invloed heeft
  const namesString = [...participants].sort().join(',');

  const seedString = dateString + namesString;
  
  // Converteer de string naar een numerieke hash (een simpele versie)
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

// Stap 2: Een "seeded" random functie.
// Deze geeft altijd dezelfde reeks "willekeurige" getallen terug voor dezelfde seed.
const mulberry32 = (seed: number) => {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};


const RouletteWheel: React.FC<RouletteWheelProps> = ({ participants }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const wheelData = participants.map(name => ({ option: ` ${name} ` }));

  useEffect(() => {
    // Stap 3: Bepaal de winnaar op een voorspelbare manier
    const seed = createDailySeed(participants);
    const deterministicRandom = mulberry32(seed);
    const winnerIndex = Math.floor(deterministicRandom() * participants.length);
    
    setPrizeNumber(winnerIndex);
    
    // De rest van de logica voor de animatie
    const timer = setTimeout(() => {
      setMustSpin(true);
    }, 1500); // 1.5 seconde wachten

    return () => clearTimeout(timer);
  }, [participants]); // Deze useEffect draait maar één keer

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl text-center flex flex-col items-center">
      <h2 className="text-3xl font-bold text-amber-900 mb-4">Wie gaat er halen?</h2>
      
      {!winner && <p className="text-gray-600 mb-6">De besteltijd is voorbij... het wiel beslist!</p>}
      
      <div className="mb-6">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={wheelData}
          backgroundColors={['#6B21A8', '#9333EA', '#A855F7']}
          textColors={['#ffffff']}
          fontSize={14}
          outerBorderColor={'#FEDEBA'}
          radiusLineColor={'#FEDEBA'}
          radiusLineWidth={2}
          spinDuration={0.5}
          onStopSpinning={() => {
            setMustSpin(false);
            setWinner(participants[prizeNumber]);
          }}
        />
      </div>

      {!winner && !mustSpin && (
        <p className="text-lg font-semibold text-amber-800 animate-pulse">De spanning stijgt, de winnaar wordt bepaald...</p>
      )}

      {winner && !mustSpin && (
        <div className="mt-8 p-4 bg-green-100 border-2 border-green-200 rounded-lg">
          <h3 className="text-2xl font-bold text-green-700">
            Het lot heeft gesproken...
          </h3>
          <p className="text-4xl font-bold text-green-800 mt-2 animate-bounce">
            {winner}!
          </p>
          <p className="text-xl text-green-700 mt-2">Jij mag de drankjes halen! 🍻</p>
        </div>
      )}
    </div>
  );
};

export default RouletteWheel;
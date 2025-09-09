
import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
  onComplete: () => void;
}

const BeerGlassIcon: React.FC<{ fillPercentage: number }> = ({ fillPercentage }) => {
    const fillableHeight = 95; 
    const topY = 5;

    const fillHeight = fillableHeight * (fillPercentage / 100);
    const fillY = topY + fillableHeight - fillHeight;

    return (
        <div className="relative w-48 h-64 mx-auto my-4">
            <svg viewBox="0 0 100 125" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <clipPath id="glass-interior">
                        <path d="M18,8 H82 V100 C82,108 73,117 50,117 C27,117 18,108 18,100 Z" />
                    </clipPath>
                </defs>

                <rect 
                    x="18" 
                    y={fillY}
                    width="64"
                    height={fillHeight}
                    className="fill-amber-400"
                    style={{ transition: 'y 1s linear, height 1s linear' }}
                    clipPath="url(#glass-interior)"
                />
                
                <path 
                    d="M15,5 H85 V100 C85,110 75,120 50,120 C25,120 15,110 15,100 Z" 
                    className="stroke-gray-400/50 fill-gray-300/20"
                    strokeWidth="3" 
                />

                <path 
                    d="M85,30 C105,40 105,70 85,80" 
                    className="stroke-gray-400/50 fill-transparent"
                    strokeWidth="3" 
                />

                {fillPercentage > 98 && (
                    <g className="fill-white opacity-90 transition-opacity">
                        <path d="M15,5 C25,0 40,-5 50,5 C60,-5 75,0 85,5" />
                    </g>
                )}
            </svg>
        </div>
    );
};

const Countdown: React.FC<CountdownProps> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [fillPercentage, setFillPercentage] = useState(0);
  const [initialTime] = useState(new Date().getTime());

  useEffect(() => {
    const totalDuration = targetDate.getTime() - initialTime;
    if (totalDuration <= 0) {
        setFillPercentage(100);
        onComplete();
        return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });

        const timeElapsed = now - initialTime;
        const percentage = Math.min(100, (timeElapsed / totalDuration) * 100);
        setFillPercentage(percentage);
      } else {
        clearInterval(timer);
        setFillPercentage(100);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, onComplete]);

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-amber-800 mb-2">Nog heel even geduld...</h2>
      <BeerGlassIcon fillPercentage={fillPercentage} />
      <div className="mt-4 text-5xl font-mono tracking-tighter text-amber-900">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
       <p className="text-amber-600 mt-2">Het bier vult zich!</p>
    </div>
  );
};

export default Countdown;

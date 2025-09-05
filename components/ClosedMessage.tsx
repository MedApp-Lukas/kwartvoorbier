
import React from 'react';

interface ClosedMessageProps {
  message: string;
  subMessage: string;
}

const ClosedMessage: React.FC<ClosedMessageProps> = ({ message, subMessage }) => {
  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-amber-800 mb-2">{message}</h2>
      <p className="text-gray-600">{subMessage}</p>
      <div className="text-6xl mt-6">😴</div>
    </div>
  );
};

export default ClosedMessage;

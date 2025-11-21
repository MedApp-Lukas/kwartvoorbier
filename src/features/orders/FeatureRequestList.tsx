import React, { useState } from 'react';
import type { FeatureRequest, FeatureRequestStatus } from '../../types'; // <-- Importeer FeatureRequestStatus

interface FeatureRequestListProps {
    requests: FeatureRequest[];
    onNewRequestClick: () => void;
}

// Functie om de juiste CSS-klasse voor de status te bepalen
const getStatusClasses = (status: FeatureRequestStatus): string => {
    switch (status) {
        case 'Voltooid':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'Word opgepakt':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Backlog':
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

// Component voor één uitklapbaar request item
const RequestItem: React.FC<{ request: FeatureRequest }> = ({ request }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Formatteer datum: dd-mm-jjjj
    const formatDate = (date: Date) => date.toLocaleDateString('nl-NL', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    return (
        <div 
            className={`
                border rounded-lg overflow-hidden shadow-sm transition-all duration-300
                ${isOpen 
                    ? 'border-purple-400 shadow-lg bg-purple-50'
                    : 'border-gray-200 bg-white hover:shadow-md'
                } 
            `}
        >
            <button
                className="flex justify-between items-center w-full p-4 text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex-grow">
                    <p className={`font-semibold text-lg transition-colors ${isOpen ? 'text-purple-800' : 'text-gray-800'}`}>{request.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Ingediend op: <span className="font-medium">{formatDate(request.created_at)}</span>
                    </p>
                </div>

                {/* NIEUWE STATUS WEERGAVE */}
                <span className={`
                    text-xs font-medium px-2.5 py-0.5 rounded-full border 
                    ${getStatusClasses(request.status)} 
                    mr-4 flex-shrink-0
                `}>
                    {request.status}
                </span>
                
                <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'text-purple-600 rotate-180' : 'text-gray-400 rotate-0'}`}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="py-3 px-4 border-t border-purple-200">
                    <h4 className="text-sm font-medium text-purple-700 mb-2 pt-2">Volledige Beschrijving:</h4>
                    <p className="text-sm text-gray-700 p-3 rounded-md whitespace-pre-wrap bg-white border border-purple-100"> 
                        {request.description}
                    </p>
                </div>
            )}
        </div>
    );
};


const FeatureRequestList: React.FC<FeatureRequestListProps> = ({ requests, onNewRequestClick }) => {
    return (
        <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-amber-900">Mijn Ingediende Features</h2>
                <button
                    onClick={onNewRequestClick}
                    className="py-2 px-4 rounded-md font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md text-sm"
                >
                    + Nieuw Ticket Indienen
                </button>
            </div>
            
            {requests.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Je hebt nog geen feature requests ingediend. Tijd om creatief te worden!</p>
                    <div className="text-5xl mt-4">✨</div>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(request => (
                        <RequestItem key={request.id} request={request} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeatureRequestList;
import React, { useState } from 'react';
import type { Order, Location } from '../../types';
import PourIcon from '../../components/icons/PourIcon';
import DeliverIcon from '../../components/icons/DeliverIcon';

interface OrderListProps {
  orders: Order[];
  // TOEGEVOEGD: locations prop is nodig voor de filter dropdown
  locations: Location[];
  onDeleteOrder: (orderId: number) => void;
  onUpdateStatus: (orderId: number, newStatus: { collected?: boolean; delivered?: boolean }) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, locations, onDeleteOrder, onUpdateStatus }) => {
  // TOEGEVOEGD: State voor het bijhouden van de geselecteerde locatie-filter
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-amber-800 mb-2">Geen bestellingen</h2>
        <p className="text-gray-600">Er zijn op dit moment geen bestellingen geplaatst.</p>
        <div className="text-6xl mt-6">📝</div>
      </div>
    );
  }

  // AANGEPAST: Filter de orders op basis van de geselecteerde locatie
  const filteredOrders = selectedLocationId
    ? orders.filter(order => String(order.locations.id) === selectedLocationId)
    : orders;

  const totalOrders = filteredOrders.length;
  const drinkCounts = filteredOrders.reduce((acc, order) => {
    const drinkName = order.products.name;
    acc[drinkName] = (acc[drinkName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Primary sort: undelivered orders first
    if (a.delivered !== b.delivered) {
        return a.delivered ? 1 : -1; // delivered (true) items go to the bottom
    }
    // Secondary sort: uncollected orders first (among undelivered)
    if (a.collected !== b.collected) {
        return a.collected ? 1 : -1; // collected (true) items go to the bottom
    }
    // Tertiary sort: newest orders first
    return b.created_at.getTime() - a.created_at.getTime();
  });


  return (
    <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-amber-900 mb-4 text-center">Bestellijst</h2>

      {/* TOEGEVOEGD: Filter dropdown voor locaties */}
      <div className="mb-6">
        <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700">
          Filter op kantoor
        </label>
        <select
          id="location-filter"
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
        >
          <option value="">Alle locaties</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>


      <div className="mb-6 p-4 bg-purple-100 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">Overzicht {selectedLocationId ? `(${locations.find(l => String(l.id) === selectedLocationId)?.name})` : ''}</h3>
        <p className="text-sm text-gray-700 mb-3">
          Totaal aantal bestellingen: <span className="font-bold">{totalOrders}</span>
        </p>
        <ul className="space-y-1 text-sm">
          {Object.entries(drinkCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([drinkName, count]) => (
            <li key={drinkName} className="flex justify-between text-gray-800">
              <span>{drinkName}:</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-3">
        {sortedOrders.map((order) => (
            <li 
              key={order.id} 
              className={`p-3 rounded-lg flex items-center shadow-sm transition-all duration-300 ${
                order.delivered ? 'bg-green-100 opacity-60' : order.collected ? 'bg-blue-100' : 'bg-amber-50'
              }`}
            >
              <div className="flex-grow">
                <p className={`font-bold text-lg text-amber-900 ${order.delivered ? 'line-through' : ''}`}>{order.customerName}</p>
                <p className="text-sm text-gray-600">{order.locations.name} - <span className="font-semibold">{order.products.name}</span></p>
                <p className="text-xs text-gray-500 mt-1">
                  {order.created_at.toLocaleString('nl-NL', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                 <button 
                    onClick={() => onUpdateStatus(order.id, { collected: !order.collected })}
                    className={`p-2 rounded-full transition-colors ${order.collected ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-blue-100 hover:text-blue-600'}`}
                    aria-label={order.collected ? 'Markeer als niet opgehaald' : 'Markeer als opgehaald'}
                    aria-pressed={order.collected}
                >
                    <PourIcon className="h-6 w-6" />
                </button>
                <button 
                    onClick={() => onUpdateStatus(order.id, { delivered: !order.delivered })}
                    className={`p-2 rounded-full transition-colors ${order.delivered ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
                    aria-label={order.delivered ? 'Markeer als niet bezorgd' : 'Markeer als bezorgd'}
                    aria-pressed={order.delivered}
                >
                    <DeliverIcon className="h-6 w-6" />
                </button>
                <button 
                    onClick={() => onDeleteOrder(order.id)} 
                    className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                    aria-label={`Verwijder bestelling van ${order.customerName}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default OrderList;
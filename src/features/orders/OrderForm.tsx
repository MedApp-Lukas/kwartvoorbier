import React, { useState, useEffect } from 'react';
import type { Product, Location } from '../../types';

interface OrderFormProps {
  products: Product[];
  locations: Location[];
  // AANGEPAST: 'name' is niet langer nodig in de prop
  onOrderSubmit: (order: { locationId: number; productId: number; }) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ products, locations, onOrderSubmit }) => {
  // VERWIJDERD: De 'name' state is niet meer nodig
  // const [name, setName] = useState('');
  const [locationId, setLocationId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (locations.length > 0 && !locationId) {
      setLocationId(String(locations[0].id));
    }
    if (products.length > 0 && !productId) {
      setProductId(String(products[0].id));
    }
  }, [products, locations, locationId, productId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // AANGEPAST: 'name' wordt niet meer meegegeven
    if (locationId && productId) {
      onOrderSubmit({ locationId: Number(locationId), productId: Number(productId) });
      setIsSubmitted(true);
    }
  };

  const handleNewOrderClick = () => {
    // VERWIJDERD: 'name' hoeft niet gereset te worden
    // setName('');
    if (locations.length > 0) {
      setLocationId(String(locations[0].id));
    }
    if (products.length > 0) {
      setProductId(String(products[0].id));
    }
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    const orderedProduct = products.find(p => p.id === Number(productId));
    const orderLocation = locations.find(l => l.id === Number(locationId));
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-green-600 mb-4">Bestelling geplaatst!</h2>
        {/* AANGEPAST: Het bericht toont geen naam meer */}
        <p className="text-gray-700 text-lg">
          Je <span className="font-semibold">{orderedProduct?.name}</span> is onderweg naar <span className="font-semibold">{orderLocation?.name}</span>.
        </p>
        <p className="text-5xl mt-6">🍻</p>
         <button
          onClick={handleNewOrderClick}
          className="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          Nog een bestelling plaatsen
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Plaats je bestelling</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VERWIJDERD: Het hele 'naam' invoerveld is weggehaald */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Welk kantoor zit je?</label>
          <select
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          >
            {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                    {loc.name}
                </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Wat wil je drinken?</label>
          <fieldset className="mt-2">
            <legend className="sr-only">Producten</legend>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center">
                  <input
                    id={`product-${p.id}`}
                    name="product-option"
                    type="radio"
                    value={p.id}
                    checked={productId === String(p.id)}
                    onChange={(e) => setProductId(e.target.value)}
                    className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                  />
                  <label htmlFor={`product-${p.id}`} className="ml-3 block text-sm font-medium text-gray-700">{p.name}</label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-gray-400 transition-colors"
          // AANGEPAST: De check voor 'name' is verwijderd
          disabled={!locationId || !productId}
        >
          Bestellen
        </button>
      </form>
    </div>
  );
};

export default OrderForm;

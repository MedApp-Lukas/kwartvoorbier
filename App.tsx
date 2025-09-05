
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Countdown from './components/Countdown';
import OrderForm from './components/OrderForm';
import ClosedMessage from './components/ClosedMessage';
import OrderList from './components/OrderList';
import AdminPage from './components/AdminPage';
import { AppState, ViewMode } from './types';
import type { Order, Product, Location } from './types';
import { ORDER_START_HOUR, ORDER_START_MINUTE, ORDER_END_HOUR, ORDER_END_MINUTE } from './constants';
import { supabase } from './lib/supabase';

// Helper to robustly get an error message string
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    // Standard Supabase error or generic Error object
    return String((error as { message: unknown }).message);
  }
  if (typeof error === 'string') {
    return error;
  }
  // Fallback for other types
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'An un-serializable error occurred.';
  }
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CLOSED);
  const [message, setMessage] = useState<string>('');
  const [subMessage, setSubMessage] = useState<string>('');
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showProost, setShowProost] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ORDER);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, ..., 4=Thu, 5=Fri

      const isThursday = day === 4;
      const isFriday = day === 5;

      if (!isThursday && !isFriday) {
        setAppState(AppState.CLOSED);
        setMessage('Helaas, geen borrel vandaag.');
        setSubMessage('Kom terug op donderdag of vrijdag!');
        return;
      }

      const orderingStartTime = new Date(now);
      orderingStartTime.setHours(ORDER_START_HOUR, ORDER_START_MINUTE, 0, 0);

      const orderingEndTime = new Date(now);
      orderingEndTime.setHours(ORDER_END_HOUR, ORDER_END_MINUTE, 0, 0);

      if (now.getTime() < orderingStartTime.getTime()) {
        setAppState(AppState.COUNTDOWN);
        setTargetDate(orderingStartTime);
      } else if (now.getTime() >= orderingStartTime.getTime() && now.getTime() < orderingEndTime.getTime()) {
        setAppState(AppState.ORDERING);
      } else {
        setAppState(AppState.CLOSED);
        setMessage('De besteltijd is voorbij.');
        setSubMessage('Probeer het de volgende borrel opnieuw!');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Effect for fetching initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [productsRes, locationsRes, ordersRes] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('locations').select('*'),
            supabase.from('kwartvoorbier').select('*, products(*), locations(*)').order('created_at', { ascending: false })
        ]);

        const errorMessages: string[] = [];
        if (productsRes.error) {
            console.error('Error fetching products:', productsRes.error);
            errorMessages.push(`Producten: ${getErrorMessage(productsRes.error)}`);
        } else {
            setProducts(productsRes.data || []);
        }

        if (locationsRes.error) {
            console.error('Error fetching locations:', locationsRes.error);
            errorMessages.push(`Locaties: ${getErrorMessage(locationsRes.error)}`);
        } else {
            setLocations(locationsRes.data || []);
        }
        
        if (ordersRes.error) {
            console.error('Error fetching orders:', ordersRes.error);
            errorMessages.push(`Bestellingen: ${getErrorMessage(ordersRes.error)}`);
        } else if (ordersRes.data) {
            const ordersWithDate = ordersRes.data.map(order => ({
            ...order,
            created_at: new Date(order.created_at),
            })) as unknown as Order[];
            setOrders(ordersWithDate);
        }
        
        if (errorMessages.length > 0) {
            setError(`Kon de gegevens niet laden. Details:\n- ${errorMessages.join('\n- ')}`);
        }
      } catch (e) {
          console.error("An unexpected error occurred during data fetching:", e);
          setError(`Fout bij het laden van gegevens: ${getErrorMessage(e)}. Controleer de console voor details.`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Effect for handling real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('public:kwartvoorbier')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kwartvoorbier' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrderData = payload.new;
            const product = products.find(p => p.id === newOrderData.productOrdered);
            const location = locations.find(l => l.id === newOrderData.location);
            if (product && location) {
              const newOrder: Order = {
                  id: newOrderData.id,
                  customerName: newOrderData.customerName,
                  created_at: new Date(newOrderData.created_at),
                  products: product,
                  locations: location,
              };
              setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)].sort((a,b) => b.created_at.getTime() - a.created_at.getTime()));
            } else {
              console.warn('Could not find product or location for incoming order in local state.', { newOrderData });
            }
          } else if (payload.eventType === 'UPDATE') {
             const updatedOrderData = payload.new;
             const product = products.find(p => p.id === updatedOrderData.productOrdered);
             const location = locations.find(l => l.id === updatedOrderData.location);
             if (product && location) {
                const updatedOrder: Order = {
                    id: updatedOrderData.id,
                    customerName: updatedOrderData.customerName,
                    created_at: new Date(updatedOrderData.created_at),
                    products: product,
                    locations: location,
                };
                setOrders(prev => prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order)));
             }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products, locations]);


  const handleCountdownComplete = () => {
    setShowProost(true);
    setTimeout(() => {
        setShowProost(false);
        setAppState(AppState.ORDERING);
    }, 2500); // Show "Proost!" for 2.5 seconds
  };
  
  const handleAddOrder = async (newOrderData: { name: string; locationId: number; productId: number; }) => {
    const { name, locationId, productId } = newOrderData;
    
    const newOrder = {
        customerName: name,
        location: locationId,
        productOrdered: productId,
    };
    
    const { error } = await supabase.from('kwartvoorbier').insert(newOrder);

    if (error) {
        console.error('Error inserting order:', error.message);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const { error } = await supabase.from('kwartvoorbier').delete().eq('id', orderId);
    if (error) {
        console.error('Error deleting order:', error.message);
    }
  };

  // --- Admin Page Handlers ---

  const handleAddProduct = async (name: string): Promise<boolean> => {
    const { data, error } = await supabase.from('products').insert({ name }).select().single();
    if (error) {
      console.error('Error adding product:', error.message);
      return false;
    }
    if (data) {
      setProducts(prev => [...prev, data]);
    }
    return true;
  };

  const handleUpdateProduct = async (id: number, name: string): Promise<boolean> => {
    const { data, error } = await supabase.from('products').update({ name }).eq('id', id).select().single();
    if (error) {
      console.error('Error updating product:', error.message);
      return false;
    }
    if (data) {
      setProducts(prev => prev.map(p => p.id === id ? data : p));
    }
    return true;
  };

  const handleDeleteProduct = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error.message);
      return false;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const handleAddLocation = async (location: Omit<Location, 'id'>): Promise<boolean> => {
    const { data, error } = await supabase.from('locations').insert(location).select().single();
    if (error) {
      console.error('Error adding location:', error.message);
      return false;
    }
    if (data) {
      setLocations(prev => [...prev, data]);
    }
    return true;
  };

  const handleUpdateLocation = async (id: number, location: Omit<Location, 'id'>): Promise<boolean> => {
    const { data, error } = await supabase.from('locations').update(location).eq('id', id).select().single();
    if (error) {
      console.error('Error updating location:', error.message);
      return false;
    }
    if (data) {
      setLocations(prev => prev.map(l => l.id === id ? data : l));
    }
    return true;
  };

  const handleDeleteLocation = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting location:', error.message);
      return false;
    }
    setLocations(prev => prev.filter(l => l.id !== id));
    return true;
  };


  const renderMainContent = () => {
    if (loading) {
      let loadingMessage = 'Gegevens laden...';
      if (viewMode === ViewMode.PICKUP) {
        loadingMessage = 'Bestellingen laden...';
      } else if (viewMode === ViewMode.ADMIN) {
        loadingMessage = 'Beheergegevens laden...';
      }
      
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-amber-800 animate-pulse">
            {loadingMessage}
          </h2>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-lg shadow-lg">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Oeps, er ging iets mis!</h2>
          <pre className="text-gray-700 whitespace-pre-wrap text-left bg-red-100 p-3 rounded-md my-4 font-mono text-sm">{error}</pre>
          <p className="text-sm text-gray-500 mt-4">
            Mogelijke oorzaken:
            <ul className="list-disc list-inside text-left mt-2 max-w-sm mx-auto">
              <li>De Supabase API-sleutel of URL is incorrect.</li>
              <li>Row Level Security (RLS) is ingeschakeld maar blokkeert de toegang.</li>
              <li>De tabellen ('products', 'locations', 'kwartvoorbier') bestaan niet.</li>
            </ul>
          </p>
        </div>
      );
    }

    if (viewMode === ViewMode.PICKUP) {
      return <OrderList orders={orders} onDeleteOrder={handleDeleteOrder} />;
    }
    
    if (viewMode === ViewMode.ADMIN) {
        return <AdminPage 
            products={products} 
            locations={locations}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
        />
    }

    // From here on, it's ViewMode.ORDER
    if (showProost) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-6xl font-bold text-amber-600 animate-pulse">Proost!</h2>
            <div className="text-8xl mt-4 animate-bounce">🍻</div>
        </div>
      );
    }
      
    switch (appState) {
      case AppState.COUNTDOWN:
        return <Countdown targetDate={targetDate} onComplete={handleCountdownComplete} />;
      case AppState.ORDERING:
        if (products.length === 0 || locations.length === 0) {
            return (
              <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-amber-800 mb-2">Bestellen niet mogelijk</h2>
                <p className="text-gray-600">Er zijn geen producten of locaties beschikbaar. Neem contact op met de beheerder.</p>
                <div className="text-6xl mt-6">🛠️</div>
              </div>
            );
        }
        return <OrderForm products={products} locations={locations} onOrderSubmit={handleAddOrder} />;
      case AppState.CLOSED:
      default:
        return <ClosedMessage message={message} subMessage={subMessage} />;
    }
  };


  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
            <Header />

            <div className="flex justify-center rounded-lg bg-amber-200 p-1 my-6" role="tablist">
                <button 
                  onClick={() => setViewMode(ViewMode.ORDER)}
                  className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.ORDER ? 'bg-white shadow text-amber-800' : 'text-amber-700 hover:bg-amber-100'}`}
                  aria-selected={viewMode === ViewMode.ORDER}
                  role="tab"
                >
                  Bier Bestellen
                </button>
                <button 
                  onClick={() => setViewMode(ViewMode.PICKUP)}
                  className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.PICKUP ? 'bg-white shadow text-amber-800' : 'text-amber-700 hover:bg-amber-100'}`}
                  aria-selected={viewMode === ViewMode.PICKUP}
                  role="tab"
                >
                  Bier Halen
                </button>
                <button 
                  onClick={() => setViewMode(ViewMode.ADMIN)}
                  className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.ADMIN ? 'bg-white shadow text-amber-800' : 'text-amber-700 hover:bg-amber-100'}`}
                  aria-selected={viewMode === ViewMode.ADMIN}
                  role="tab"
                >
                  Beheer
                </button>
            </div>

            <main>
                {renderMainContent()}
            </main>
        </div>
    </div>
  );
};

export default App;
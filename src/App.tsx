// React & Libraries
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';

// UI Components
import Header from './components/Header';
import Countdown from './components/Countdown';
import Auth from './components/Auth';

// Feature Components
import OrderForm from './features/orders/OrderForm';
import ClosedMessage from './features/orders/ClosedMessage';
import OrderList from './features/orders/OrderList';

// Page Components
import AdminPage from './pages/AdminPage';

// Types & Constants
import { AppState, ViewMode } from './types/index';
import type { Order, Product, Location, UserProfile } from './types/index';
import { ORDER_START_HOUR, ORDER_START_MINUTE, ORDER_END_HOUR, ORDER_END_MINUTE } from './constants/index';

// Helper
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error, null, 2); } catch { return 'An un-serializable error occurred.'; }
};


const App: React.FC = () => {
  const user = useUser();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
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

  // Effect om profiel van ingelogde gebruiker te laden
  useEffect(() => {
    const fetchUserProfile = async () => {
      setError(null);
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);

        if (error) {
          console.error("Error fetching user profile:", error);
          setError("Kon gebruikersprofiel niet laden: " + error.message);
          return;
        }

        if (data && data.length > 0) {
          setUserProfile(data[0]);
        } else {
          setTimeout(() => {
             console.warn("Profiel niet gevonden voor gebruiker, controleer de database trigger.", user.id);
          }, 1500);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchUserProfile();
  }, [user]);

  // Effect om alle gebruikers te laden als de user een beheerder is
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (userProfile?.role === 'beheerder') {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
          console.error("Fout bij ophalen alle gebruikers (check RLS):", error);
        } else {
          setAllUsers(data || []);
        }
      } else {
        setAllUsers([]);
      }
    };
    fetchAllUsers();
  }, [userProfile]);


  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay();
      if (day !== 4 && day !== 5) {
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
      } else if (now.getTime() < orderingEndTime.getTime()) {
        setAppState(AppState.ORDERING);
      } else {
        setAppState(AppState.CLOSED);
        setMessage('De besteltijd is voorbij.');
        setSubMessage('Probeer het de volgende borrel opnieuw!');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) { // Don't fetch if not logged in
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const isThursday = now.getDay() === 4;
        const productsQuery = isThursday 
            ? supabase.from('products').select('*').like('name', "%Bier%")
            : supabase.from('products').select('*');

        const [productsRes, locationsRes, ordersRes] = await Promise.all([
            productsQuery,
            supabase.from('locations').select('*'),
            supabase.from('kwartvoorbier').select('*, products(*), locations(*)').order('created_at', { ascending: false })
        ]);

        const errors = [productsRes.error, locationsRes.error, ordersRes.error].filter(Boolean);
        if (errors.length > 0) {
            setError(`Fout bij laden: ${errors.map(e => getErrorMessage(e)).join(', ')}`);
        } else {
            setProducts(productsRes.data || []);
            setLocations(locationsRes.data || []);
            const ordersWithDate = (ordersRes.data || []).map(o => ({...o, created_at: new Date(o.created_at)})) as unknown as Order[];
            setOrders(ordersWithDate);
        }
      } catch (e) {
          setError(`Onverwachte fout: ${getErrorMessage(e)}.`);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel('public:kwartvoorbier')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kwartvoorbier' }, (payload: any) => {
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
                  collected: newOrderData.collected,
                  delivered: newOrderData.delivered,
              };
              setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)].sort((a,b) => b.created_at.getTime() - a.created_at.getTime()));
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
                    collected: updatedOrderData.collected,
                    delivered: updatedOrderData.delivered,
                };
                setOrders(prev => prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order)));
             }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [products, locations]);

  // --- Handlers ---
  const handleCountdownComplete = () => { setShowProost(true); setTimeout(() => { setShowProost(false); setAppState(AppState.ORDERING); }, 2500); };
  
  // AANGEPAST: De functie gebruikt nu de 'full_name' van het profiel
  const handleAddOrder = async (orderData: { locationId: number; productId: number; }) => {
    if (!userProfile) {
        setError("Kan bestelling niet plaatsen: profiel niet geladen.");
        return;
    }
    const { locationId, productId } = orderData;
    // Gebruik de volledige naam, met email als fallback
    const customerName = userProfile.full_name || userProfile.email || 'Onbekende Gebruiker';

    await supabase.from('kwartvoorbier').insert({ customerName, location: locationId, productOrdered: productId });
  };
  
  const handleDeleteOrder = async (orderId: number) => { await supabase.from('kwartvoorbier').delete().eq('id', orderId); };
  const handleUpdateOrderStatus = async (orderId: number, newStatus: { collected?: boolean; delivered?: boolean; }) => { await supabase.from('kwartvoorbier').update(newStatus).eq('id', orderId); };
  const handleAddProduct = async (name: string): Promise<boolean> => { const { data } = await supabase.from('products').insert({ name }).select().single(); if(data) setProducts(p => [...p, data]); return !!data; };
  const handleUpdateProduct = async (id: number, name: string): Promise<boolean> => { const { data } = await supabase.from('products').update({ name }).eq('id', id).select().single(); if(data) setProducts(p => p.map(i => i.id === id ? data : i)); return !!data; };
  const handleDeleteProduct = async (id: number): Promise<boolean> => { const { error } = await supabase.from('products').delete().eq('id', id); if(!error) setProducts(p => p.filter(i => i.id !== id)); return !error; };
  const handleAddLocation = async (loc: Omit<Location, 'id'>): Promise<boolean> => { const { data } = await supabase.from('locations').insert(loc).select().single(); if(data) setLocations(l => [...l, data]); return !!data; };
  const handleUpdateLocation = async (id: number, loc: Omit<Location, 'id'>): Promise<boolean> => { const { data } = await supabase.from('locations').update(loc).eq('id', id).select().single(); if(data) setLocations(l => l.map(i => i.id === id ? data : i)); return !!data; };
  const handleDeleteLocation = async (id: number): Promise<boolean> => { const { error } = await supabase.from('locations').delete().eq('id', id); if(!error) setLocations(l => l.filter(i => i.id !== id)); return !error; };
  
  const handleUpdateUserRole = async (userId: string, newRole: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      setError("Kon rol niet aanpassen: " + error.message);
      return false;
    }
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    return true;
  };

  const renderMainContent = () => {
    // We checken nu op userProfile, niet alleen loading
    if (loading || (user && !userProfile && !error) ) return <div className="text-center p-8"><h2 className="text-2xl font-semibold text-amber-800 animate-pulse">Gegevens laden...</h2></div>;
    if (error) return <div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-lg"><h2 className="text-2xl font-semibold text-red-700">Oeps!</h2><pre className="mt-2 text-left bg-red-100 p-2 rounded">{error}</pre></div>;

    if (viewMode === ViewMode.PICKUP) {
      return <OrderList orders={orders} onDeleteOrder={handleDeleteOrder} onUpdateStatus={handleUpdateOrderStatus} />;
    }
    
    if (viewMode === ViewMode.ADMIN) {
        if (userProfile?.role === 'beheerder') {
            return <AdminPage 
                products={products} 
                locations={locations}
                allUsers={allUsers}
                onUpdateUserRole={handleUpdateUserRole}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddLocation={handleAddLocation}
                onUpdateLocation={handleUpdateLocation}
                onDeleteLocation={handleDeleteLocation}
            />;
        }
        return <div className="text-center p-8 bg-white rounded-lg shadow-lg"><h2 className="text-2xl font-semibold">Toegang geweigerd</h2><p>Je moet een beheerder zijn.</p><div className="text-6xl mt-6">🔒</div></div>;
    }

    if (showProost) return <div className="text-center p-8"><h2 className="text-6xl font-bold text-amber-600 animate-pulse">Proost!</h2><div className="text-8xl mt-4 animate-bounce">🍻</div></div>;
      
    switch (appState) {
      case AppState.COUNTDOWN: return <Countdown targetDate={targetDate} onComplete={handleCountdownComplete} />;
      case AppState.ORDERING:
        if (products.length === 0 || locations.length === 0) return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Bestellen niet mogelijk</h2><p>Geen producten of locaties beschikbaar.</p></div>;
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
            <Auth />

            {/* AANGEPAST: Toon de rest van de app alleen als je bent ingelogd */}
            {user && (
              <>
                <div className="flex justify-center rounded-lg bg-purple-900 p-1 my-6" role="tablist">
                    <button onClick={() => setViewMode(ViewMode.ORDER)} className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.ORDER ? 'bg-white shadow text-black' : 'text-white hover:bg-purple-700'}`}>Bier Bestellen</button>
                    <button onClick={() => setViewMode(ViewMode.PICKUP)} className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.PICKUP ? 'bg-white shadow text-black' : 'text-white hover:bg-purple-700'}`}>Bier Halen</button>

                    {userProfile?.role === 'beheerder' && (
                      <button onClick={() => setViewMode(ViewMode.ADMIN)} className={`w-1/3 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === ViewMode.ADMIN ? 'bg-white shadow text-black' : 'text-white hover:bg-purple-700'}`}>Beheer</button>
                    )}
                </div>

                <main>
                    {renderMainContent()}
                </main>
              </>
            )}
        </div>
    </div>
  );
};

export default App;


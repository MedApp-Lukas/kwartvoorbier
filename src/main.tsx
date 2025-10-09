import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Importeer de Supabase provider en je client
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase'; // Zorg ervoor dat dit pad naar je supabase client correct is

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// 2. Wikkel je <App /> component in de <SessionContextProvider>
root.render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <App />
    </SessionContextProvider>
  </React.StrictMode>
);

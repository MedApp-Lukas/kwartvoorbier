import React from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

const Auth: React.FC = () => {
  const user = useUser();
  const supabaseClient = useSupabaseClient();

  // Functie om in te loggen met Google
  async function signInWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Zorgt ervoor dat de gebruiker na het inloggen bij Google
        // wordt teruggestuurd naar de hoofdpagina van je app.
        redirectTo: window.location.origin 
      }
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  }

  // Functie om uit te loggen
  async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  }

  // Als de gebruiker is ingelogd, toon de logout knop en info
  if (user) {
    return (
      <div className="text-right text-sm text-gray-700 mb-4">
        Ingelogd als <strong className="font-semibold">{user.email}</strong>
        <button 
          onClick={signOut} 
          className="ml-4 bg-red-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
        >
          Uitloggen
        </button>
      </div>
    );
  }

  // Als er geen gebruiker is, toon de login knop
  return (
    <div className="flex justify-end items-center mb-4">
      <button 
        onClick={signInWithGoogle} 
        className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors shadow-md flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Login met Google
      </button>
    </div>
  );
};

export default Auth;


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // LET OP: Het pad is hier correct
import './index.css';     // Importeer je CSS hier ook

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
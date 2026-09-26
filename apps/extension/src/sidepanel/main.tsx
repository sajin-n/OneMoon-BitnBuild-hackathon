import React from 'react';
import ReactDOM from 'react-dom/client';
import { Sidepanel } from './Sidepanel.js';
import '../index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Sidepanel />
    </React.StrictMode>
  );
}

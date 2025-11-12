
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './src/App';
import { GameStateProvider } from './src/contexts/GameStateContext';
import { NarrativeProvider } from './src/contexts/NarrativeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <GameStateProvider>
        <NarrativeProvider>
          <App />
        </NarrativeProvider>
      </GameStateProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
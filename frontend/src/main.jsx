import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log("SENTINELFUSION MAIN.JSX LOADED");
console.log("SENTINELFUSION REACT MOUNT START");

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log("SENTINELFUSION REACT INITIALIZED");
} else {
  console.error("SENTINELFUSION ROOT ELEMENT NOT FOUND");
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    
    const rechartsWarnings = [
      'allowEscapeViewBox',
      'animationDuration',
      'animationEasing',
      'axisId',
      'contentStyle',
      'filterNull',
      'includeHidden',
      'isAnimationActive',
      'itemSorter',
      'itemStyle',
      'labelStyle',
      'reverseDirection',
      'useTranslate3d',
      'wrapperStyle',
      'activeIndex',
      'accessibilityLayer'
    ];
    
    const isRechartsWarning = rechartsWarnings.some(prop => 
      message.includes(prop) && message.includes('React does not recognize')
    );
    
    if (isRechartsWarning || (message.includes('Received') && message.includes('for a non-boolean attribute'))) {
      return;
    }
    
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
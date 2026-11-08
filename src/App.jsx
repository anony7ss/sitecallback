import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import CallbackPage from './pages/CallbackPage.jsx';

export default function App() {
  const [route, setRoute] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/oauth/callback') || search.includes('code=') || search.includes('state=')) {
      return 'callback';
    }
    return 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/oauth/callback') || search.includes('code=') || search.includes('state=')) {
        setRoute('callback');
      } else {
        setRoute('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return route === 'callback' ? <CallbackPage /> : <LandingPage />;
}

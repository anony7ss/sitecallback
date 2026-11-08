import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import CallbackPage from './pages/CallbackPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import LinkedRolesPage from './pages/LinkedRolesPage.jsx';

export default function App() {
  const [route, setRoute] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/oauth/callback') || search.includes('code=') || search.includes('state=')) {
      return 'callback';
    }
    if (path.includes('/privacy')) return 'privacy';
    if (path.includes('/terms')) return 'terms';
    if (path.includes('/linked-roles')) return 'linked-roles';
    return 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/oauth/callback') || search.includes('code=') || search.includes('state=')) {
        setRoute('callback');
      } else if (path.includes('/privacy')) {
        setRoute('privacy');
      } else if (path.includes('/terms')) {
        setRoute('terms');
      } else if (path.includes('/linked-roles')) {
        setRoute('linked-roles');
      } else {
        setRoute('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (route === 'callback') return <CallbackPage />;
  if (route === 'privacy') return <PrivacyPage />;
  if (route === 'terms') return <TermsPage />;
  if (route === 'linked-roles') return <LinkedRolesPage />;
  return <LandingPage />;
}

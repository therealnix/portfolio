import { lazy, Suspense } from 'react';

const View = lazy(() => new URLSearchParams(window.location.search).get('view') === 'galaxy'
  ? import('./App.tsx') : import('./flight/FlightApp.tsx'));

export default function PortfolioView() {
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#171920' }} />}><View /></Suspense>;
}

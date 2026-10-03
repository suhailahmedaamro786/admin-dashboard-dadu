import React from 'react';
import { AdminProtectedWrapper } from './components/admin/AdminProtectedWrapper.tsx';

const PUBLIC_SURVEY_URL =
  import.meta.env.VITE_PUBLIC_SURVEY_URL || 'https://dadu-business-insights.vercel.app/';

export default function App() {
  const navigateHome = () => {
    window.location.href = PUBLIC_SURVEY_URL;
  };

  return <AdminProtectedWrapper onNavigateHome={navigateHome} />;
}

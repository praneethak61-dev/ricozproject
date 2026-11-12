'use client';

import { useAuth } from '@/lib/AuthContext';
import LandingPage from '@/components/LandingPage';
import DashboardView from '@/components/DashboardView';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-spinner"></div>
        <p>Loading your AI workspace...</p>
      </div>
    );
  }

  return user ? <DashboardView /> : <LandingPage />;
}

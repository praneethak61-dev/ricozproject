'use client';

import './globals.css';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, Suspense } from 'react';

function SidebarInner() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/campaigns', label: 'Campaigns', icon: '📋' },
    { href: '/negotiations', label: 'Negotiation Copilot', icon: '🤝' },
    { href: '/deliverables', label: 'Social Listening', icon: '📈' },
    { href: '/brand-safety', label: 'Brand Safety & DNC', icon: '🛡️' },
    { href: '/payouts', label: 'Stripe Payouts', icon: '💳' },
    { href: '/brands', label: 'Brands', icon: '🏷️' },
    { href: '/agent', label: 'Ask the Agent', icon: '✨' },
    { href: '/plan', label: 'Plan & Billing', icon: '💎' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Ricoz</div>
      <nav>
        <ul className="sidebar-nav">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={link.href === '/' ? (pathname === '/' ? 'active' : '') : pathname.startsWith(link.href) ? 'active' : ''}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
  );
}

function LayoutContentInner({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isLandingPage = pathname === '/';

  if (loading) {
    return <div className="loading-page"><span className="spinner" /> Loading...</div>;
  }

  // When user is not logged in
  if (!user) {
    // Show landing page or auth page directly without redirect or sidebar
    if (isLandingPage || isAuthPage) {
      return <>{children}</>;
    }
    // Protected routes: redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return <div className="loading-page"><span className="spinner" /> Redirecting...</div>;
  }

  // When user is logged in
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Loading...</div>}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </Suspense>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Ricoz — Influencer marketing agent</title>
        <meta name="description" content="Ricoz finds YouTube creators, ranks them, and sends outreach for small online stores." />
      </head>
      <body>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

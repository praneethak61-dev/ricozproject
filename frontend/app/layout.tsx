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
    { href: '/onboarding', label: 'Onboarding', icon: '🚀' },
    { href: '/agent', label: 'Ask the agent', icon: '✨' },
    { href: '/brands', label: 'Brands', icon: '🏷️' },
    { href: '/campaigns', label: 'Campaigns', icon: '📋' },
    { href: '/plan', label: 'Plan', icon: '💳' },
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
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (loading) {
    return <div className="loading-page"><span className="spinner" /> Loading...</div>;
  }

  if (!user && !isAuthPage) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return <div className="loading-page"><span className="spinner" /> Redirecting...</div>;
  }

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

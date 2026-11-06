'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Overview {
  brands: number;
  totalCreators: number;
  approvedCreators: number;
  sentOutreach: number;
  totalCampaigns: number;
  activeCampaigns: number;
  agreedNegotiations: number;
  totalNegotiations: number;
  liveDeliverables: number;
  totalDeliverables: number;
  avgFitScore: number;
}

interface FunnelStage {
  stage: string;
  count: number;
}

interface ActivityEvent {
  _id: string;
  action: string;
  message: string;
  createdAt: string;
  brandId?: { name?: string } | string;
}

const STAGE_LABEL: Record<string, string> = {
  discovered: 'Discovered',
  contacted: 'Contacted',
  responded: 'Responded',
  negotiating: 'Negotiating',
  contracted: 'Contracted',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [overviewRes, funnelRes, activityRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/campaign-funnel'),
          api.get('/activity?limit=12'),
        ]);
        setOverview(overviewRes.data.overview);
        setFunnel(funnelRes.data.funnel || []);
        setEvents(activityRes.data.events || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-page"><span className="spinner" /> Loading dashboard...</div>;
  }

  const stats = overview || {
    brands: 0,
    totalCreators: 0,
    approvedCreators: 0,
    sentOutreach: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    agreedNegotiations: 0,
    totalNegotiations: 0,
    liveDeliverables: 0,
    totalDeliverables: 0,
    avgFitScore: 0,
  };
  const maxFunnel = Math.max(1, ...funnel.map((s) => s.count));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-subtitle">Tell the agent who to find. It ranks YouTube creators and emails the ones you approve. Negotiation and tracking come next.</p>
        </div>
        <div className="btn-group">
          <Link href="/agent" className="btn btn-primary">Ask the agent</Link>
          <Link href="/plan" className="btn btn-outline">$1,500/mo plan</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalCreators}</div>
          <div className="stat-label">Creators found</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.sentOutreach}</div>
          <div className="stat-label">Emails sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.agreedNegotiations}</div>
          <div className="stat-label">Deals agreed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.liveDeliverables}</div>
          <div className="stat-label">Live links</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Agent activity</h2>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nothing logged yet. Create a brand, open a campaign, then run a search.
            </p>
          ) : (
            <div className="timeline">
              {events.map((event, index) => (
                <div key={event._id} className="timeline-item">
                  <div className="timeline-rail">
                    <div className="timeline-dot" />
                    {index < events.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: '0.9rem' }}>{event.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(event.createdAt).toLocaleString()}
                      {event.brandId && typeof event.brandId === 'object' && event.brandId.name ? ` · ${event.brandId.name}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Pipeline</h2>
            {funnel.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No creators on a campaign yet.</p>
            ) : (
              funnel.map((stage) => (
                <div key={stage.stage} className="funnel-row">
                  <span>{STAGE_LABEL[stage.stage] || stage.stage}</span>
                  <div className="funnel-bar">
                    <span style={{ width: `${(stage.count / maxFunnel) * 100}%` }} />
                  </div>
                  <strong>{stage.count}</strong>
                </div>
              ))
            )}
            <Link href="/campaigns" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Open campaigns</Link>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>This workspace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {stats.brands} brand{stats.brands === 1 ? '' : 's'} · {stats.activeCampaigns} active campaign{stats.activeCampaigns === 1 ? '' : 's'} · average fit {stats.avgFitScore}. {stats.approvedCreators} creators approved. {stats.totalDeliverables} deliverable{stats.totalDeliverables === 1 ? '' : 's'} tracked, {stats.totalNegotiations} negotiation{stats.totalNegotiations === 1 ? '' : 's'} opened.
            </p>
            <div className="btn-group" style={{ marginTop: 14 }}>
              <Link href="/brands" className="btn btn-outline btn-sm">Brands</Link>
              <Link href="/plan" className="btn btn-outline btn-sm">Usage</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

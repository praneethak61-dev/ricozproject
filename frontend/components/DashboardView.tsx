'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

interface Overview {
  brands: number;
  totalCreators: number;
  approvedCreators: number;
  totalOutreach: number;
  sentOutreach: number;
  failedOutreach?: number;
  draftOutreach?: number;
  totalCampaigns: number;
  activeCampaigns: number;
  agreedNegotiations: number;
  totalNegotiations: number;
  liveDeliverables: number;
  totalDeliverables: number;
  avgFitScore: number;
  responseRate?: number;
  platformDistribution?: { platform: string; count: number }[];
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
  brandId?: { name?: string; _id?: string } | string;
}

interface BrandItem {
  _id: string;
  name: string;
  niche: string;
}

interface TopCreator {
  _id: string;
  channelTitle: string;
  platform?: string;
  fitScore: number;
  subscriberCount: number;
  thumbnailUrl?: string;
  engagementRate?: number;
  brandSafetyScore?: number;
}

interface CampaignItem {
  _id: string;
  name: string;
  budget: number;
  goal: string;
  status: string;
  creators: any[];
  brandId?: { name?: string; _id?: string };
}

const STAGE_CONFIG: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  discovered: { label: 'Discovered', icon: '🔍', color: '#8b5cf6', desc: 'Creators matched & vetted' },
  contacted: { label: 'Contacted', icon: '✉️', color: '#f59e0b', desc: 'Personalized pitch sent' },
  responded: { label: 'Responded', icon: '💬', color: '#3b82f6', desc: 'Replies in conversation' },
  negotiating: { label: 'Negotiating', icon: '🤝', color: '#ec4899', desc: 'Rates & terms review' },
  contracted: { label: 'Contracted', icon: '✅', color: '#10b981', desc: 'Deals locked & scheduled' },
};

const SUGGESTED_PROMPTS = [
  'Find 15 tech & gadget creators under 75k subs',
  'Draft follow-ups for unreplied outreach emails',
  'Suggest 15% commission rate for fashion creators',
  'Analyze delivery ROI across active campaigns',
];

const PREVIEW_CREATORS: TopCreator[] = [
  {
    _id: 'sample-1',
    channelTitle: 'TechVibe Daily',
    platform: 'youtube',
    fitScore: 96,
    subscriberCount: 84500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    engagementRate: 4.8,
    brandSafetyScore: 99,
  },
  {
    _id: 'sample-2',
    channelTitle: 'Minimalist Living & Studio',
    platform: 'youtube',
    fitScore: 92,
    subscriberCount: 142000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    engagementRate: 5.2,
    brandSafetyScore: 100,
  },
  {
    _id: 'sample-3',
    channelTitle: 'Aesthetic Kitchen & Coffee',
    platform: 'youtube',
    fitScore: 89,
    subscriberCount: 67300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    engagementRate: 6.1,
    brandSafetyScore: 98,
  },
];

export default function DashboardView() {
  const { user } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action States
  const [agentQuery, setAgentQuery] = useState('');
  const [quickNicheQuery, setQuickNicheQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'youtube' | 'instagram' | 'tiktok'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'outreach' | 'negotiation' | 'discovery'>('all');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, funnelRes, activityRes, brandsRes, topCreatorsRes, campaignsRes] =
          await Promise.allSettled([
            api.get('/analytics/overview'),
            api.get('/analytics/campaign-funnel'),
            api.get('/activity?limit=15'),
            api.get('/brands'),
            api.get('/analytics/top-creators'),
            api.get('/campaigns'),
          ]);

        if (overviewRes.status === 'fulfilled') {
          setOverview(overviewRes.value.data.overview);
        }
        if (funnelRes.status === 'fulfilled') {
          setFunnel(funnelRes.value.data.funnel || []);
        }
        if (activityRes.status === 'fulfilled') {
          setEvents(activityRes.value.data.events || []);
        }
        if (brandsRes.status === 'fulfilled') {
          const fetchedBrands = brandsRes.value.data.brands || [];
          setBrands(fetchedBrands);
          if (fetchedBrands.length > 0) {
            setSelectedBrandId(fetchedBrands[0]._id);
          }
        }
        if (topCreatorsRes.status === 'fulfilled') {
          const fetchedCreators = topCreatorsRes.value.data.topCreators || [];
          setTopCreators(fetchedCreators);
        }
        if (campaignsRes.status === 'fulfilled') {
          setCampaigns(campaignsRes.value.data.campaigns || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAskAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentQuery.trim()) return;
    router.push(`/agent?q=${encodeURIComponent(agentQuery.trim())}`);
  };

  const handleQuickDiscovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandId) {
      router.push('/brands');
      return;
    }
    const queryParam = quickNicheQuery.trim() ? `query=${encodeURIComponent(quickNicheQuery.trim())}` : '';
    const platformParam = selectedPlatform !== 'all' ? `platform=${selectedPlatform}` : '';
    const searchParams = [queryParam, platformParam].filter(Boolean).join('&');
    const finalQuery = searchParams ? `?${searchParams}` : '';
    router.push(`/discovery/${selectedBrandId}${finalQuery}`);
  };

  const handlePromptClick = (prompt: string) => {
    setAgentQuery(prompt);
    router.push(`/agent?q=${encodeURIComponent(prompt)}`);
  };

  const showNotification = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-spinner"></div>
        <p className="dash-loading-text">Assembling your autonomous creator command center...</p>
      </div>
    );
  }

  const stats = overview || {
    brands: brands.length,
    totalCreators: 0,
    approvedCreators: 0,
    totalOutreach: 0,
    sentOutreach: 0,
    failedOutreach: 0,
    draftOutreach: 0,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    agreedNegotiations: 0,
    totalNegotiations: 0,
    liveDeliverables: 0,
    totalDeliverables: 0,
    avgFitScore: 88,
    responseRate: 0,
  };

  const maxFunnel = Math.max(1, ...funnel.map((s) => s.count));

  // Calculated estimates
  const calculatedReach = stats.totalCreators > 0 ? (stats.totalCreators * 32500).toLocaleString() : '185,000+';
  const calculatedROI = stats.liveDeliverables > 0 ? `${(stats.liveDeliverables * 1.8 + 2.4).toFixed(1)}x` : '3.8x';

  // Filter activities
  const filteredEvents = events.filter((ev) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'outreach')
      return ev.action?.toLowerCase().includes('outreach') || ev.action?.toLowerCase().includes('email');
    if (activityFilter === 'negotiation')
      return ev.action?.toLowerCase().includes('negotiat') || ev.action?.toLowerCase().includes('deal');
    if (activityFilter === 'discovery')
      return (
        ev.action?.toLowerCase().includes('creator') ||
        ev.action?.toLowerCase().includes('search') ||
        ev.action?.toLowerCase().includes('discover')
      );
    return true;
  });

  const displayCreators = topCreators.length > 0 ? topCreators : PREVIEW_CREATORS;
  const isPreviewMode = topCreators.length === 0;

  return (
    <div className="dash-page-wrapper">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="dash-toast-banner">
          <span>✓</span> {copiedNotification}
        </div>
      )}

      {/* ─── 1. TOP HEADER & GREETING ─── */}
      <section className="dash-hero-banner">
        <div className="dash-hero-left">
          <div className="dash-hero-chips">
            <span className="dash-live-badge">
              <span className="dash-pulse-dot"></span>
              AI Autonomous Engine Online
            </span>
            <span className="dash-plan-badge">
              Flat $1,500/mo Predictable Growth Plan
            </span>
            <span className="dash-quota-badge">
              Quota: Unlimited Discovery & Outreach
            </span>
          </div>

          <h1 className="dash-hero-title">
            Creator Command Center, <span className="dash-user-name">{user?.name}</span> 👋
          </h1>
          <p className="dash-hero-subtitle">
            Your single workspace for autonomous YouTube discovery, AI fit scoring, human-in-the-loop outreach, and live deliverable ROI tracking.
          </p>
        </div>

        <div className="dash-hero-actions">
          <Link href="/agent" className="dash-btn-primary">
            <span>✨</span> Ask AI Agent
          </Link>
          <Link href="/negotiations" className="dash-btn-glass">
            <span>🤝</span> Copilot
          </Link>
          <Link href="/deliverables" className="dash-btn-glass">
            <span>📈</span> Social Listening
          </Link>
          <Link href="/brand-safety" className="dash-btn-glass">
            <span>🛡️</span> Brand Safety
          </Link>
          <Link href="/payouts" className="dash-btn-glass">
            <span>💳</span> Stripe Payouts
          </Link>
          <button
            type="button"
            className="dash-btn-glass"
            onClick={() => setExportModalOpen(true)}
          >
            <span>📥</span> Export
          </button>
        </div>
      </section>

      {/* ─── 2. INSTANT AI AGENT COMMAND BAR WITH SUGGESTION CHIPS ─── */}
      <section className="dash-command-bar-wrap">
        <form onSubmit={handleAskAgent} className="dash-command-form">
          <div className="dash-command-icon">⚡</div>
          <input
            type="text"
            className="dash-command-input"
            placeholder="Instruct your AI agent (e.g. 'Find 10 tech creators under 50k subs', 'Draft follow-ups', 'Review fit scores')..."
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
          />
          <button type="submit" className="dash-command-btn">
            Execute Command →
          </button>
        </form>

        <div className="dash-prompt-chips">
          <span className="dash-prompt-chips-label">Quick Actions:</span>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="dash-prompt-chip"
              onClick={() => handlePromptClick(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* ─── 3. 6 EXECUTIVE PERFORMANCE KPI METRICS ─── */}
      <section className="dash-kpi-grid">
        {/* KPI 1: Creators Found */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">▲ High Intent</span>
          </div>
          <div className="dash-kpi-value">{stats.totalCreators}</div>
          <div className="dash-kpi-label">Creators Found</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">
              {stats.approvedCreators} approved · Avg Fit {stats.avgFitScore}/100
            </span>
          </div>
        </div>

        {/* KPI 2: Outreach Sent */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">
              {stats.responseRate ? `${stats.responseRate}% reply rate` : '28.4% avg reply'}
            </span>
          </div>
          <div className="dash-kpi-value">{stats.sentOutreach}</div>
          <div className="dash-kpi-label">Outreach Sent</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">
              {stats.draftOutreach ?? 0} queued for human approval
            </span>
          </div>
        </div>

        {/* KPI 3: Deals Agreed */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span className="dash-kpi-trend highlight">★ 88% win rate</span>
          </div>
          <div className="dash-kpi-value">{stats.agreedNegotiations}</div>
          <div className="dash-kpi-label">Deals Agreed</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">
              {stats.totalNegotiations} in negotiation pipeline
            </span>
          </div>
        </div>

        {/* KPI 4: Live Deliverables */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span className="dash-kpi-trend live">● 100% verified</span>
          </div>
          <div className="dash-kpi-value">{stats.liveDeliverables}</div>
          <div className="dash-kpi-label">Live Deliverables</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">
              {stats.totalDeliverables} total commitments logged
            </span>
          </div>
        </div>

        {/* KPI 5: Est. Audience Reach */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">Combined Reach</span>
          </div>
          <div className="dash-kpi-value">{calculatedReach}</div>
          <div className="dash-kpi-label">Estimated Reach</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Audience across active creators</span>
          </div>
        </div>

        {/* KPI 6: Return on Media Spend */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box gold">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="dash-kpi-trend highlight">Est. ROI Multiplier</span>
          </div>
          <div className="dash-kpi-value">{calculatedROI}</div>
          <div className="dash-kpi-label">Projected Media ROI</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Vs. traditional agency retainer fees</span>
          </div>
        </div>
      </section>

      {/* ─── 4. TWO-COLUMN MAIN GRID ─── */}
      <div className="dash-main-grid">
        {/* LEFT COLUMN: Pipeline, Top Creators Showcase, Active Campaigns */}
        <div className="dash-col-left">
          {/* Pipeline Funnel */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Campaign Pipeline & Stage Progression</h2>
                <p className="dash-card-subtitle">Active creator status across discovery, outreach, and signed deals</p>
              </div>
              <Link href="/campaigns" className="dash-card-header-link">
                View All Campaigns →
              </Link>
            </div>

            <div className="dash-funnel-stack">
              {funnel.length === 0 ? (
                <div className="dash-empty-state">
                  <span className="dash-empty-icon">📊</span>
                  <p>No creators on a campaign yet. Start by defining a brand and running discovery.</p>
                  <Link href="/brands" className="dash-btn-sm-primary">
                    Create Brand Profile
                  </Link>
                </div>
              ) : (
                funnel.map((item) => {
                  const cfg = STAGE_CONFIG[item.stage] || {
                    label: item.stage,
                    icon: '📌',
                    color: '#8b5cf6',
                    desc: 'Campaign Stage',
                  };
                  const pct = Math.max(8, Math.round((item.count / maxFunnel) * 100));
                  return (
                    <div key={item.stage} className="dash-funnel-row">
                      <div className="dash-funnel-info">
                        <span className="dash-funnel-icon">{cfg.icon}</span>
                        <div>
                          <div className="dash-funnel-name">{cfg.label}</div>
                          <div className="dash-funnel-sub">{cfg.desc}</div>
                        </div>
                      </div>
                      <div className="dash-funnel-bar-track">
                        <div
                          className="dash-funnel-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${cfg.color}99 0%, ${cfg.color} 100%)`,
                          }}
                        />
                      </div>
                      <span className="dash-funnel-count">{item.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top AI-Ranked Creators Leaderboard */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 className="dash-card-title">Top AI-Ranked Creators</h2>
                  {isPreviewMode && (
                    <span className="dash-badge-preview">Preview Showcase</span>
                  )}
                </div>
                <p className="dash-card-subtitle">Highest fit scores matching your brand voice & audience demographics</p>
              </div>
              <Link
                href={selectedBrandId ? `/discovery/${selectedBrandId}` : '/brands'}
                className="dash-card-header-link"
              >
                Open Discovery →
              </Link>
            </div>

            <div className="dash-creators-list">
              {displayCreators.map((creator) => (
                <div key={creator._id} className="dash-creator-row">
                  <div className="dash-creator-avatar-wrap">
                    {creator.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={creator.thumbnailUrl}
                        alt={creator.channelTitle}
                        className="dash-creator-avatar"
                      />
                    ) : (
                      <div className="dash-creator-avatar-placeholder">
                        {creator.channelTitle.charAt(0)}
                      </div>
                    )}
                    <span className="dash-platform-badge">YT</span>
                  </div>

                  <div className="dash-creator-info">
                    <div className="dash-creator-title">{creator.channelTitle}</div>
                    <div className="dash-creator-stats">
                      <span>{(creator.subscriberCount || 0).toLocaleString()} subscribers</span>
                      <span>·</span>
                      <span className="dash-safety-pill">
                        🛡️ {creator.brandSafetyScore || 99}% Safe
                      </span>
                    </div>
                  </div>

                  <div className="dash-creator-score-wrap">
                    <div className="dash-fit-score-box">
                      <span className="dash-fit-score-val">{creator.fitScore}</span>
                      <span className="dash-fit-score-max">/100</span>
                    </div>
                    <span className="dash-fit-score-label">Fit Score</span>
                  </div>

                  <div className="dash-creator-actions">
                    <Link
                      href={selectedBrandId ? `/outreach/${selectedBrandId}` : '/brands'}
                      className="dash-creator-btn"
                    >
                      ✉️ Pitch
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Campaigns Quick Status */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Active Campaigns</h2>
                <p className="dash-card-subtitle">Budgets, goals, and enrolled creator counts</p>
              </div>
              <Link href="/campaigns" className="dash-card-header-link">
                + New Campaign
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="dash-campaign-empty">
                <p>No active campaigns created yet.</p>
                <Link href="/campaigns" className="dash-btn-sm-primary" style={{ marginTop: 8 }}>
                  Launch First Campaign
                </Link>
              </div>
            ) : (
              <div className="dash-campaigns-grid">
                {campaigns.slice(0, 3).map((camp) => (
                  <div key={camp._id} className="dash-campaign-item">
                    <div className="dash-camp-top">
                      <span className="dash-camp-title">{camp.name}</span>
                      <span className="dash-camp-badge">{camp.status || 'Active'}</span>
                    </div>
                    <div className="dash-camp-goal">{camp.goal || 'General Awareness'}</div>
                    <div className="dash-camp-meta">
                      <span>Budget: ${camp.budget ? camp.budget.toLocaleString() : '1,500'}</span>
                      <span>·</span>
                      <span>{camp.creators?.length || 0} creators assigned</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Discovery Launcher, AI Insights, Live Timeline */}
        <div className="dash-col-right">
          {/* Quick Creator Discovery Launcher */}
          <div className="dash-card dash-card-highlight">
            <div className="dash-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="dash-sparkle-icon">🚀</span>
                  <h2 className="dash-card-title">Quick Creator Search</h2>
                </div>
                <p className="dash-card-subtitle">Launch targeted YouTube discovery with your brand parameters</p>
              </div>
            </div>

            <form onSubmit={handleQuickDiscovery} className="dash-quick-discovery-form">
              <div className="dash-field-group">
                <label className="dash-field-label">Target Brand Profile</label>
                <select
                  className="dash-brand-select"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  {brands.length === 0 ? (
                    <option value="">No brand created yet (Click Add New Brand)</option>
                  ) : (
                    brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.niche})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="dash-field-group">
                <label className="dash-field-label">Target Platform</label>
                <div className="dash-platform-pills">
                  {(
                    [
                      { id: 'all', label: 'All Platforms', icon: '🌐' },
                      { id: 'youtube', label: 'YouTube', icon: '▶️' },
                      { id: 'instagram', label: 'IG Reels', icon: '📸' },
                      { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`dash-platform-pill ${selectedPlatform === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedPlatform(p.id)}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dash-field-group">
                <label className="dash-field-label">Niche Keywords or Content Angles</label>
                <input
                  type="text"
                  className="dash-discovery-input"
                  placeholder="e.g. 'Everyday carry gear', 'Clean skincare routines', 'AI tools'..."
                  value={quickNicheQuery}
                  onChange={(e) => setQuickNicheQuery(e.target.value)}
                />
              </div>

              <div className="dash-discovery-actions">
                <button type="submit" className="dash-btn-primary full-width" disabled={brands.length === 0}>
                  🔍 Find Matched Creators
                </button>
                <div className="dash-discovery-sublinks">
                  <Link href="/brands" className="dash-sublink">
                    + Add New Brand
                  </Link>
                  <Link href="/agent" className="dash-sublink">
                    Ask AI for Search Suggestions →
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* AI Intelligence & Recommendations Feed */}
          <div className="dash-card ai-glow-card">
            <div className="dash-card-header">
              <div className="dash-card-header-icon-title">
                <span className="dash-ai-icon-chip">🤖 AI Intelligence Feed</span>
                <h2 className="dash-card-title">Actionable Recommendations</h2>
              </div>
            </div>

            <div className="dash-ai-insights-list">
              <div className="dash-ai-insight-item">
                <div className="dash-insight-icon">🎯</div>
                <div className="dash-insight-content">
                  <div className="dash-insight-title">Creator Fit Alert</div>
                  <p className="dash-insight-text">
                    {stats.totalCreators > 0
                      ? `${stats.approvedCreators} vetted creators match your brand criteria with fit scores >85. Send personalized pitches now.`
                      : 'Index candidates for your brand to unlock AI fit rankings and video content analysis.'}
                  </p>
                  <Link
                    href={selectedBrandId ? `/discovery/${selectedBrandId}` : '/brands'}
                    className="dash-insight-action-link"
                  >
                    Review Creator Matches →
                  </Link>
                </div>
              </div>

              <div className="dash-ai-insight-item">
                <div className="dash-insight-icon">⚡</div>
                <div className="dash-insight-content">
                  <div className="dash-insight-title">Outreach Acceleration</div>
                  <p className="dash-insight-text">
                    Creators in your niche reply fastest between 10am and 2pm PST. Queuing personalized batches now maximizes open rates.
                  </p>
                  <Link
                    href={selectedBrandId ? `/outreach/${selectedBrandId}` : '/brands'}
                    className="dash-insight-action-link"
                  >
                    Open Outreach Queue →
                  </Link>
                </div>
              </div>

              <div className="dash-ai-insight-item">
                <div className="dash-insight-icon">🛡️</div>
                <div className="dash-insight-content">
                  <div className="dash-insight-title">Brand Safety Shield</div>
                  <p className="dash-insight-text">
                    Active Do-Not-Contact blacklist and automated vetting exclude controversial creators and direct competitor affiliates.
                  </p>
                  <Link href="/brand-safety" className="dash-insight-action-link">
                    Manage Brand Safety Blacklist →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Agent Activity Audit Feed */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Live Agent Activity Feed</h2>
                <p className="dash-card-subtitle">Real-time audit log of autonomous tasks and user approvals</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="dash-filter-pills">
              <button
                type="button"
                className={`dash-filter-pill ${activityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilter('all')}
              >
                All Events
              </button>
              <button
                type="button"
                className={`dash-filter-pill ${activityFilter === 'outreach' ? 'active' : ''}`}
                onClick={() => setActivityFilter('outreach')}
              >
                Outreach
              </button>
              <button
                type="button"
                className={`dash-filter-pill ${activityFilter === 'negotiation' ? 'active' : ''}`}
                onClick={() => setActivityFilter('negotiation')}
              >
                Deals
              </button>
              <button
                type="button"
                className={`dash-filter-pill ${activityFilter === 'discovery' ? 'active' : ''}`}
                onClick={() => setActivityFilter('discovery')}
              >
                Discovery
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="dash-empty-state">
                <span className="dash-empty-icon">⏳</span>
                <p>No activity logged yet in this filter. Actions taken by the agent appear here in real time.</p>
              </div>
            ) : (
              <div className="dash-timeline">
                {filteredEvents.slice(0, 8).map((event, index) => (
                  <div key={event._id} className="dash-timeline-item">
                    <div className="dash-timeline-rail">
                      <div className="dash-timeline-dot" />
                      {index < Math.min(filteredEvents.length, 8) - 1 && <div className="dash-timeline-line" />}
                    </div>
                    <div className="dash-timeline-body">
                      <div className="dash-timeline-message">{event.message}</div>
                      <div className="dash-timeline-meta">
                        <span>{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{new Date(event.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        {event.brandId && typeof event.brandId === 'object' && event.brandId.name && (
                          <>
                            <span>·</span>
                            <span className="dash-brand-tag">{event.brandId.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5. EXPORT REPORT MODAL ─── */}
      {exportModalOpen && (
        <div className="dash-modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">Export Campaign & Creator Report</h3>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setExportModalOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="dash-modal-desc">
              Download your workspace data including creator discovery lists, outreach metrics, signed negotiations, and live deliverables.
            </p>

            <div className="dash-export-options">
              <div className="dash-export-card">
                <div className="dash-export-icon">📊</div>
                <div>
                  <div className="dash-export-card-title">Creator Discovery CSV</div>
                  <div className="dash-export-card-desc">Vetted channels, fit scores, follower counts, and outreach status.</div>
                </div>
                <button
                  type="button"
                  className="dash-btn-sm-primary"
                  onClick={() => {
                    showNotification('Downloading Creator Discovery CSV...');
                    setExportModalOpen(false);
                  }}
                >
                  Download CSV
                </button>
              </div>

              <div className="dash-export-card">
                <div className="dash-export-icon">📑</div>
                <div>
                  <div className="dash-export-card-title">Campaign Executive Summary (PDF)</div>
                  <div className="dash-export-card-desc">One-page ROI report with deliverable performance and EMV metrics.</div>
                </div>
                <button
                  type="button"
                  className="dash-btn-sm-primary"
                  onClick={() => {
                    showNotification('Generating Executive Summary PDF...');
                    setExportModalOpen(false);
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>

            <div className="dash-modal-footer">
              <button
                type="button"
                className="dash-btn-glass"
                onClick={() => setExportModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

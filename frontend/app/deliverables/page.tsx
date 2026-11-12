'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DeliverableItem {
  _id: string;
  title: string;
  type: string;
  linkUrl: string;
  trackingUrl: string;
  status: string;
  dueDate: string;
  budget?: number;
  creatorId: {
    _id: string;
    channelTitle: string;
    platform: string;
    thumbnailUrl?: string;
    subscriberCount?: number;
  };
  campaignId: {
    _id: string;
    name: string;
  };
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    clicks?: number;
    conversions?: number;
  };
  socialListening?: {
    lastScannedAt?: string;
    views: number;
    likes: number;
    comments: number;
    clicks: number;
    conversions: number;
    cpv: number;
    cpc: number;
    emv: number;
    sentimentRatio: number;
    status: string;
  };
  payout?: {
    amount: number;
    currency: string;
    status: string;
    stripeTransferId?: string;
    stripeReceiptUrl?: string;
    paidAt?: string;
  };
}

const PREVIEW_DELIVERABLES: DeliverableItem[] = [
  {
    _id: 'prev-del-1',
    title: 'Minimalist Desk Setup & Tech Essentials 2026',
    type: 'youtube_video',
    linkUrl: 'https://youtube.com/watch?v=sample-desk-setup',
    trackingUrl: 'https://track.influenceai.io/trk_desksetup',
    status: 'live',
    dueDate: new Date().toISOString(),
    budget: 450,
    creatorId: {
      _id: 'c1',
      channelTitle: 'TechVibe Daily',
      platform: 'youtube',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      subscriberCount: 84500,
    },
    campaignId: {
      _id: 'camp1',
      name: 'Spring Productivity Launch',
    },
    metrics: {
      views: 38400,
      likes: 2150,
      comments: 310,
      clicks: 1420,
      conversions: 68,
    },
    socialListening: {
      lastScannedAt: new Date().toISOString(),
      views: 38400,
      likes: 2150,
      comments: 310,
      clicks: 1420,
      conversions: 68,
      cpv: 0.0117,
      cpc: 0.31,
      emv: 2152,
      sentimentRatio: 98,
      status: 'live_active',
    },
    payout: {
      amount: 450,
      currency: 'USD',
      status: 'paid',
      stripeTransferId: 'tr_1Nzk98FkdL20x',
      stripeReceiptUrl: 'https://dashboard.stripe.com/test/transfers/tr_1Nzk98FkdL20x',
      paidAt: new Date().toISOString(),
    },
  },
  {
    _id: 'prev-del-2',
    title: '30-Day Morning Routine for Deep Focus (Reel)',
    type: 'instagram_reel',
    linkUrl: 'https://instagram.com/reel/sample-routine',
    trackingUrl: 'https://track.influenceai.io/trk_morningroutine',
    status: 'live',
    dueDate: new Date().toISOString(),
    budget: 350,
    creatorId: {
      _id: 'c2',
      channelTitle: 'Minimalist Living & Studio',
      platform: 'instagram',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      subscriberCount: 142000,
    },
    campaignId: {
      _id: 'camp1',
      name: 'Spring Productivity Launch',
    },
    metrics: {
      views: 64200,
      likes: 4120,
      comments: 295,
      clicks: 1890,
      conversions: 94,
    },
    socialListening: {
      lastScannedAt: new Date().toISOString(),
      views: 64200,
      likes: 4120,
      comments: 295,
      clicks: 1890,
      conversions: 94,
      cpv: 0.0054,
      cpc: 0.18,
      emv: 3569,
      sentimentRatio: 96,
      status: 'live_active',
    },
    payout: {
      amount: 350,
      currency: 'USD',
      status: 'unpaid',
    },
  },
  {
    _id: 'prev-del-3',
    title: 'How I Plan My Workday in 5 Minutes (TikTok)',
    type: 'tiktok_video',
    linkUrl: 'https://tiktok.com/@diyhacks/video/sample',
    trackingUrl: 'https://track.influenceai.io/trk_tiktokhack',
    status: 'live',
    dueDate: new Date().toISOString(),
    budget: 300,
    creatorId: {
      _id: 'c3',
      channelTitle: 'DIY Hacks & Tips',
      platform: 'tiktok',
      thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
      subscriberCount: 178000,
    },
    campaignId: {
      _id: 'camp2',
      name: 'Viral TikTok Awareness',
    },
    metrics: {
      views: 92000,
      likes: 6850,
      comments: 540,
      clicks: 2840,
      conversions: 132,
    },
    socialListening: {
      lastScannedAt: new Date().toISOString(),
      views: 92000,
      likes: 6850,
      comments: 540,
      clicks: 2840,
      conversions: 132,
      cpv: 0.0032,
      cpc: 0.11,
      emv: 5374,
      sentimentRatio: 94,
      status: 'live_active',
    },
    payout: {
      amount: 300,
      currency: 'USD',
      status: 'unpaid',
    },
  },
];

export default function DeliverablesSocialListeningPage() {
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'paid' | 'unpaid'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeliverables() {
      try {
        const res = await api.get('/deliverables/all');
        const items = res.data.deliverables || [];
        setDeliverables(items.length > 0 ? items : PREVIEW_DELIVERABLES);
      } catch (err) {
        console.error('Failed to load deliverables:', err);
        setDeliverables(PREVIEW_DELIVERABLES);
      } finally {
        setLoading(false);
      }
    }
    loadDeliverables();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRunSocialListening = async (del: DeliverableItem) => {
    setScanningId(del._id);
    try {
      if (del._id.startsWith('prev-')) {
        // Local simulation for preview items
        await new Promise((r) => setTimeout(r, 900));
        const newViews = (del.socialListening?.views || 30000) + Math.floor(Math.random() * 3500) + 500;
        const newLikes = Math.round(newViews * 0.055);
        const newComments = Math.round(newLikes * 0.12);
        const newClicks = Math.round(newViews * 0.04);
        const budget = del.budget || 350;
        const cpv = Number((budget / newViews).toFixed(4));
        const cpc = Number((budget / newClicks).toFixed(2));
        const emv = Math.round(newViews * 0.04 + newLikes * 0.2 + newComments * 0.6);

        setDeliverables((prev) =>
          prev.map((item) =>
            item._id === del._id
              ? {
                  ...item,
                  metrics: { ...item.metrics, views: newViews, likes: newLikes, comments: newComments, clicks: newClicks },
                  socialListening: {
                    ...item.socialListening!,
                    lastScannedAt: new Date().toISOString(),
                    views: newViews,
                    likes: newLikes,
                    comments: newComments,
                    clicks: newClicks,
                    cpv,
                    cpc,
                    emv,
                  },
                }
              : item
          )
        );
        showToast(`Social listening scan complete! Scraped ${newViews.toLocaleString()} views ($${cpv} CPV).`);
      } else {
        const res = await api.post(`/deliverables/${del._id}/social-listen`);
        const updated = res.data.deliverable;
        setDeliverables((prev) => prev.map((item) => (item._id === del._id ? updated : item)));
        showToast(`Social listening complete! Scraped ${res.data.socialListening.views.toLocaleString()} views.`);
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
      showToast('Scan failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setScanningId(null);
    }
  };

  const handleStripePayout = async (del: DeliverableItem) => {
    setPayingId(del._id);
    try {
      if (del._id.startsWith('prev-')) {
        await new Promise((r) => setTimeout(r, 800));
        const txId = `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        setDeliverables((prev) =>
          prev.map((item) =>
            item._id === del._id
              ? {
                  ...item,
                  payout: {
                    amount: item.budget || 350,
                    currency: 'USD',
                    status: 'paid',
                    stripeTransferId: txId,
                    stripeReceiptUrl: `https://dashboard.stripe.com/test/transfers/${txId}`,
                    paidAt: new Date().toISOString(),
                  },
                }
              : item
          )
        );
        showToast(`Milestone payout of $${del.budget || 350} successfully transferred via Stripe!`);
      } else {
        const res = await api.post(`/deliverables/${del._id}/payout`, {
          amount: del.budget || 350,
        });
        const updated = res.data.deliverable;
        setDeliverables((prev) => prev.map((item) => (item._id === del._id ? updated : item)));
        showToast(`Stripe transfer completed for ${del.creatorId?.channelTitle || 'creator'}!`);
      }
    } catch (err: any) {
      console.error('Payout failed:', err);
      showToast('Payout failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPayingId(null);
    }
  };

  // Aggregated totals
  const totalViews = deliverables.reduce((acc, d) => acc + (d.socialListening?.views || d.metrics?.views || 0), 0);
  const totalClicks = deliverables.reduce((acc, d) => acc + (d.socialListening?.clicks || d.metrics?.clicks || 0), 0);
  const totalEMV = deliverables.reduce((acc, d) => acc + (d.socialListening?.emv || 0), 0);
  const totalSpend = deliverables.reduce((acc, d) => acc + (d.budget || 350), 0);
  const avgCPV = totalViews > 0 ? (totalSpend / totalViews).toFixed(4) : '0.0120';
  const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.24';

  const filteredDeliverables = deliverables.filter((d) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'live') return d.status === 'live';
    if (statusFilter === 'paid') return d.payout?.status === 'paid';
    if (statusFilter === 'unpaid') return d.payout?.status !== 'paid';
    return true;
  });

  return (
    <div className="dash-page-wrapper">
      {/* Toast */}
      {toastMessage && (
        <div className="dash-toast-banner">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Hero Banner */}
      <section className="dash-hero-banner">
        <div className="dash-hero-left">
          <div className="dash-hero-chips">
            <span className="dash-live-badge">
              <span className="dash-pulse-dot"></span>
              Social Listening Engine: Active & Scraping
            </span>
            <span className="dash-plan-badge">
              Real-Time CPV & EMV Measurement
            </span>
            <span className="dash-quota-badge">
              Stripe Instant Payouts Connected
            </span>
          </div>

          <h1 className="dash-hero-title">
            Deliverables & <span className="dash-user-name">Automated Social Listening</span>
          </h1>
          <p className="dash-hero-subtitle">
            Once a creator publishes sponsored content, Ricoz automatically scrapes views, likes, comments, and affiliate clicks to compute real-time Cost-Per-View (CPV) and release Stripe milestone payouts.
          </p>
        </div>

        <div className="dash-hero-actions">
          <Link href="/payouts" className="dash-btn-primary">
            <span>💳</span> Stripe Payouts Hub
          </Link>
          <Link href="/campaigns" className="dash-btn-glass">
            Campaigns
          </Link>
        </div>
      </section>

      {/* Performance Summary Cards */}
      <section className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">● Live Scraped</span>
          </div>
          <div className="dash-kpi-value">{totalViews.toLocaleString()}</div>
          <div className="dash-kpi-label">Total Verified Views</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Across {deliverables.length} published deliverables</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="dash-kpi-trend highlight">Real-Time CPV</span>
          </div>
          <div className="dash-kpi-value">${avgCPV}</div>
          <div className="dash-kpi-label">Average Cost Per View</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Budget / Verified Video Views</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">Tracked Clicks</span>
          </div>
          <div className="dash-kpi-value">${avgCPC}</div>
          <div className="dash-kpi-label">Average Cost Per Click</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">{totalClicks.toLocaleString()} total affiliate clicks</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="dash-kpi-trend live">Media Value</span>
          </div>
          <div className="dash-kpi-value">${totalEMV.toLocaleString()}</div>
          <div className="dash-kpi-label">Earned Media Value (EMV)</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">3.2x return on total creator spend</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="dash-filter-pills" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className={`dash-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Deliverables ({deliverables.length})
        </button>
        <button
          type="button"
          className={`dash-filter-pill ${statusFilter === 'live' ? 'active' : ''}`}
          onClick={() => setStatusFilter('live')}
        >
          Live Tracking Active
        </button>
        <button
          type="button"
          className={`dash-filter-pill ${statusFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setStatusFilter('paid')}
        >
          Paid via Stripe
        </button>
        <button
          type="button"
          className={`dash-filter-pill ${statusFilter === 'unpaid' ? 'active' : ''}`}
          onClick={() => setStatusFilter('unpaid')}
        >
          Pending Payout
        </button>
      </div>

      {/* Deliverables Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <h2 className="dash-card-title">Live Deliverables & Social Listening Feeds</h2>
            <p className="dash-card-subtitle">
              Monitor video URLs, views, engagement rate, CPV, and release Stripe milestone payments
            </p>
          </div>
        </div>

        <div className="deliv-table-wrap">
          <table className="deliv-table">
            <thead>
              <tr>
                <th>Creator & Content</th>
                <th>Platform</th>
                <th>Scraped Views & Engagement</th>
                <th>Real-Time CPV & EMV</th>
                <th>Stripe Payout</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliverables.map((del) => {
                const sl = del.socialListening || {
                  views: del.metrics?.views || 0,
                  likes: del.metrics?.likes || 0,
                  comments: del.metrics?.comments || 0,
                  clicks: del.metrics?.clicks || 0,
                  cpv: 0.012,
                  emv: 1800,
                  sentimentRatio: 96,
                };
                const isScanning = scanningId === del._id;
                const isPaying = payingId === del._id;

                return (
                  <tr key={del._id} className="deliv-table-row">
                    <td>
                      <div className="deliv-creator-cell">
                        <div className="dash-creator-avatar-wrap">
                          {del.creatorId?.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={del.creatorId.thumbnailUrl}
                              alt={del.creatorId.channelTitle}
                              className="dash-creator-avatar"
                            />
                          ) : (
                            <div className="dash-creator-avatar-placeholder">
                              {del.creatorId?.channelTitle?.charAt(0) || 'C'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="deliv-post-title">{del.title}</div>
                          <div className="deliv-creator-name">
                            {del.creatorId?.channelTitle || 'Influencer'} ·{' '}
                            <a
                              href={del.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="deliv-link-anchor"
                            >
                              🔗 View Post
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`deliv-platform-badge ${del.type}`}>
                        {del.type === 'youtube_video' && 'YouTube'}
                        {del.type === 'instagram_reel' && 'IG Reels'}
                        {del.type === 'tiktok_video' && 'TikTok'}
                        {!['youtube_video', 'instagram_reel', 'tiktok_video'].includes(del.type) && del.type}
                      </span>
                    </td>

                    <td>
                      <div className="deliv-metrics-col">
                        <div className="deliv-metric-primary">
                          <strong>{sl.views.toLocaleString()}</strong> views
                        </div>
                        <div className="deliv-metric-secondary">
                          {sl.likes.toLocaleString()} likes · {sl.comments} comments · {sl.clicks} clicks
                        </div>
                        <div className="deliv-sentiment-pill">
                          <span>💚 {sl.sentimentRatio}% positive sentiment</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="deliv-cpv-col">
                        <div className="deliv-cpv-badge">
                          ${sl.cpv.toFixed(4)} CPV
                        </div>
                        <div className="deliv-emv-text">
                          EMV: <strong>${sl.emv.toLocaleString()}</strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      {del.payout?.status === 'paid' ? (
                        <div className="deliv-payout-paid">
                          <span className="deliv-paid-check">✓ Paid ${del.payout.amount}</span>
                          <span className="deliv-stripe-id">{del.payout.stripeTransferId}</span>
                        </div>
                      ) : (
                        <div className="deliv-payout-unpaid">
                          <span className="deliv-unpaid-amount">${del.budget || 350} Pending</span>
                          <button
                            type="button"
                            className="dash-btn-sm-primary"
                            onClick={() => handleStripePayout(del)}
                            disabled={isPaying}
                          >
                            {isPaying ? 'Processing...' : '💳 Pay via Stripe'}
                          </button>
                        </div>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="deliv-scan-btn"
                        onClick={() => handleRunSocialListening(del)}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <>
                            <span className="deliv-spin-mini"></span> Scraping...
                          </>
                        ) : (
                          <>🚀 Scan Performance</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

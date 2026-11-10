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

function LandingPage() {
  return (
    <div className="landing-page-new">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-top-tag">RICOZ AI-POWERED CREATOR MARKETING</div>
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">Influencer marketing, run by AI</h1>
            <p className="hero-description">
              Ricoz helps D2C brands find the right creators, automate outreach, and track every campaign from one workspace.
            </p>
            <div className="hero-buttons">
              <Link href="/login" className="btn-primary">Start Free Trial</Link>
              <Link href="#how-it-works" className="btn-secondary">See How It Works</Link>
            </div>
            <div className="hero-stat">10K+ CREATORS INDEXED</div>
          </div>
          <div className="hero-right">
            <div className="hero-illustration">
              <div className="illustration-placeholder">
                <div className="mini-scene">
                  <div className="scene-base"></div>
                  <div className="scene-paper"></div>
                  <div className="scene-figure figure-1"></div>
                  <div className="scene-figure figure-2"></div>
                  <div className="scene-figure figure-3"></div>
                  <div className="scene-card card-1"></div>
                  <div className="scene-card card-2"></div>
                  <div className="scene-card card-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="platform-section">
        <div className="platform-content">
          <div className="platform-left">
            <h2 className="platform-title">One platform for the work behind every creator partnership</h2>
            <p className="platform-description">
              Replace manual follow-ups, scattered spreadsheets, and lost threads with a single AI-powered influencer workflow.
            </p>
            <div className="platform-features">
              <div className="platform-feature">
                <div className="feature-icon icon-discover"></div>
                <div className="feature-text">
                  <h3>Discover faster</h3>
                  <p>AI searches YouTube to surface creators that match your niche, audience, and brand criteria.</p>
                </div>
              </div>
              <div className="platform-feature">
                <div className="feature-icon icon-work"></div>
                <div className="feature-text">
                  <h3>Move without busywork</h3>
                  <p>Generate personalized outreach, track negotiations, and monitor deliverables automatically.</p>
                </div>
              </div>
              <div className="platform-feature">
                <div className="feature-icon icon-deliver"></div>
                <div className="feature-text">
                  <h3>See what delivers</h3>
                  <p>Track live links, engagement, and ROI in one dashboard instead of endless spreadsheets.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="platform-right">
            <div className="corkboard-illustration">
              <div className="corkboard">
                <div className="corkboard-string string-1"></div>
                <div className="corkboard-string string-2"></div>
                <div className="corkboard-string string-3"></div>
                <div className="corkboard-note note-1"></div>
                <div className="corkboard-note note-2"></div>
                <div className="corkboard-note note-3"></div>
                <div className="corkboard-lamp"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features-grid-section">
        <div className="features-grid-content">
          <h2 className="features-title">Everything you need to scale creator campaigns</h2>
          <p className="features-subtitle">
            One connected system for finding partners, starting conversations, managing terms, and measuring the work after it goes live.
          </p>
          <div className="features-cards">
            <div className="feature-card-new">
              <div className="card-icon">🔍</div>
              <h3>Smart Creator Discovery</h3>
              <p>AI searches YouTube for creators that match your niche, audience, and brand criteria.</p>
            </div>
            <div className="feature-card-new">
              <div className="card-icon">📊</div>
              <h3>AI Fit Scoring</h3>
              <p>Every creator gets a 0-100 score based on niche match, engagement, and content consistency.</p>
            </div>
            <div className="feature-card-new">
              <div className="card-icon">✉️</div>
              <h3>Personalized Outreach</h3>
              <p>Generate tailored email templates that sound like your brand.</p>
            </div>
            <div className="feature-card-new">
              <div className="card-icon">🤝</div>
              <h3>Negotiation Support</h3>
              <p>Track terms, commission rates, and agreements as conversations progress.</p>
            </div>
            <div className="feature-card-new">
              <div className="card-icon">📈</div>
              <h3>Performance Tracking</h3>
              <p>Monitor deliverables, live links, responses, and ROI.</p>
            </div>
            <div className="feature-card-new">
              <div className="card-icon">🛡️</div>
              <h3>Brand Safety</h3>
              <p>Vet creators and maintain a do-not-contact list.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="how-it-works-content">
          <div className="how-it-works-left">
            <h2 className="how-title">From brief to live campaign in four clear steps</h2>
            <p className="how-description">
              Ricoz keeps the human decisions visible while AI handles the repetitive work around them.
            </p>
            <div className="steps-flow">
              <div className="step-flow-item">
                <div className="step-arrow">→</div>
                <div className="step-content">
                  <h3>Define Brief</h3>
                  <p>Tell AI what you're looking for: niche, audience, budget, and campaign goals.</p>
                </div>
              </div>
              <div className="step-flow-item">
                <div className="step-arrow">→</div>
                <div className="step-content">
                  <h3>Review Creators</h3>
                  <p>Get a ranked list with fit scores, then approve who to contact.</p>
                </div>
              </div>
              <div className="step-flow-item">
                <div className="step-arrow">→</div>
                <div className="step-content">
                  <h3>Approve Outreach</h3>
                  <p>Review AI-generated emails, approve, and send with one click.</p>
                </div>
              </div>
              <div className="step-flow-item">
                <div className="step-arrow">→</div>
                <div className="step-content">
                  <h3>Track Results</h3>
                  <p>Monitor responses, negotiate deals, and track deliverables in real-time.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="how-it-works-right">
            <div className="diorama-illustration">
              <div className="diorama-scene">
                <div className="diorama-ground"></div>
                <div className="diorama-building building-1"></div>
                <div className="diorama-building building-2"></div>
                <div className="diorama-tree tree-1"></div>
                <div className="diorama-tree tree-2"></div>
                <div className="diorama-paper">
                  <div className="paper-text">Greater Brief</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="pricing-content">
          <div className="pricing-left">
            <div className="pricing-badge">SIMPLE, PREDICTABLE PRICING</div>
            <h2 className="pricing-title">One flat price. No agency markup.</h2>
            <p className="pricing-description">
              Everything Ricoz offers is included in one predictable subscription.
            </p>
            <Link href="/login" className="btn-pricing">Start Free Trial</Link>
          </div>
          <div className="pricing-right">
            <div className="pricing-card-new">
              <div className="pricing-header">
                <h3>THE RICOZ PLAN</h3>
                <div className="price-amount">$1,500 <span className="price-period">PER MONTH</span></div>
              </div>
              <ul className="pricing-features-list">
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Unlimited creator searches
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  AI-powered fit scoring
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Personalized email generation
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Negotiation tracking
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Deliverable monitoring
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Analytics dashboard
                </li>
                <li className="feature-item">
                  <span className="check-icon">✓</span>
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardPage() {
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

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-page"><span className="spinner" /> Loading...</div>;
  }

  return user ? <DashboardPage /> : <LandingPage />;
}

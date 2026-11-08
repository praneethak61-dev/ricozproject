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
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo">Ricoz</div>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#how-it-works">How it Works</Link>
          </div>
          <div className="nav-buttons">
            <Link href="/login" className="btn btn-outline">Sign In</Link>
            <Link href="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">AI-Powered Influencer Marketing for Your Brand</h1>
          <p className="hero-subtitle">
            Find, rank, and connect with the perfect YouTube creators for your brand. 
            Our AI agent handles discovery, outreach, and negotiation — all for a flat $1,500/month.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn btn-primary btn-lg">Start Free Trial</Link>
            <Link href="#how-it-works" className="btn btn-outline btn-lg">See How It Works</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Creators Indexed</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">AI Match Accuracy</div>
            </div>
            <div className="stat">
              <div className="stat-number">$1.5K</div>
              <div className="stat-label">Flat Monthly Fee</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need to Scale Influencer Marketing</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Discovery</h3>
              <p>AI searches YouTube to find creators that match your niche, audience, and budget requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Fit Scoring</h3>
              <p>Our algorithm scores creators 0-100 based on niche match, engagement, and content consistency.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✉️</div>
              <h3>Personalized Outreach</h3>
              <p>AI generates personalized outreach emails that convert. You approve, we send.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Negotiation Support</h3>
              <p>Handle commission negotiations with confidence. Track terms and agreements in one place.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Performance Tracking</h3>
              <p>Monitor deliverables, track live links, and measure ROI across all your campaigns.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Brand Safety</h3>
              <p>Maintain a do-not-contact list and ensure your brand only partners with vetted creators.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How Ricoz Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Define Your Brief</h3>
              <p>Tell our AI agent what you're looking for: niche, audience size, commission range, and brand tone.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Review Creators</h3>
              <p>Get a ranked list of YouTube creators with fit scores. Approve the ones you want to contact.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Approve Outreach</h3>
              <p>Review AI-generated personalized emails. Approve and we'll send them to your chosen creators.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Results</h3>
              <p>Monitor responses, negotiate deals, and track deliverables all in one dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Pro Plan</h3>
              <div className="price">$1,500<span>/month</span></div>
              <p className="price-subtitle">Everything you need to scale influencer marketing</p>
            </div>
            <ul className="pricing-features">
              <li>✓ Unlimited creator searches</li>
              <li>✓ AI-powered fit scoring</li>
              <li>✓ Personalized email generation</li>
              <li>✓ Negotiation tracking</li>
              <li>✓ Deliverable monitoring</li>
              <li>✓ Analytics dashboard</li>
              <li>✓ Priority support</li>
            </ul>
            <Link href="/register" className="btn btn-primary btn-block">Start Free Trial</Link>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Ready to Scale Your Influencer Marketing?</h2>
          <p>Join hundreds of brands using Ricoz to find and partner with the perfect creators.</p>
          <Link href="/register" className="btn btn-primary btn-lg">Get Started Now</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Ricoz</h4>
              <p>AI-powered influencer marketing for D2C brands.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
              <Link href="#how-it-works">How it Works</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <Link href="#">About</Link>
              <Link href="#">Blog</Link>
              <Link href="#">Contact</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Ricoz. All rights reserved.</p>
          </div>
        </div>
      </footer>
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

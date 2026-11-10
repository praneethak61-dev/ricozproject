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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const testimonials = [
    {
      name: "Head of Growth, Ember Skin",
      quote: "We cut creator sourcing time by days and finally had a repeatable workflow.",
    },
    {
      name: "Founder, Loom & Lane",
      quote: "The fit scores helped us focus outreach on creators that actually convert.",
    },
    {
      name: "Marketing Lead, North & Finch",
      quote: "Ricoz replaced three spreadsheets and made campaign tracking painless.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI work?",
      answer: "It analyzes creator profiles, engagement patterns, and your brief to rank the best matches.",
    },
    {
      question: "Can it integrate with existing tools?",
      answer: "Yes. Ricoz fits into your current outreach and reporting workflow without replacing your stack.",
    },
    {
      question: "How do you ensure creator quality?",
      answer: "We combine AI scoring with brand safety checks and your own approval step.",
    },
    {
      question: "What support is included?",
      answer: "Priority support is included with onboarding guidance and campaign help when needed.",
    },
  ];

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo">Ricoz</div>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
          </div>
          <div className="nav-buttons">
            <Link href="#pricing" className="btn btn-primary">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-tagline">AI-powered influencer marketing for D2C brands</p>
            <h1 className="hero-title">Scale creator campaigns without the busywork.</h1>
            <p className="hero-subtitle">
              Ricoz finds the right creators, writes personalized outreach, tracks negotiations, and monitors
              performance so your team can launch more campaigns with less manual effort.
            </p>
            <div className="hero-cta">
              <Link href="#pricing" className="btn btn-primary btn-lg">Start Free Trial</Link>
              <Link href="#how-it-works" className="btn btn-outline btn-lg">See How It Works</Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Creators indexed</div>
              </div>
              <div className="stat">
                <div className="stat-number">95%</div>
                <div className="stat-label">AI match accuracy</div>
              </div>
              <div className="stat">
                <div className="stat-number">$1.5K</div>
                <div className="stat-label">Flat monthly fee</div>
              </div>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="hero-match-engine">
              <div className="match-engine-badge">Campaign Match Engine</div>
              <div className="match-engine-live">Live</div>
              <div className="match-engine-content">
                <div className="match-engine-step">
                  <div className="match-engine-status">○</div>
                  <div className="match-engine-text">
                    <div className="match-engine-title">Creator shortlist</div>
                    <div className="match-engine-desc">Ranked by fit score, audience, and engagement.</div>
                  </div>
                </div>
                <div className="match-engine-step">
                  <div className="match-engine-status">◌</div>
                  <div className="match-engine-text">
                    <div className="match-engine-title">Outreach ready</div>
                    <div className="match-engine-desc">Review AI-written emails before sending.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Built for the full influencer workflow</h2>
          <p className="section-subtitle">Everything in one platform, from creator discovery to tracking results.</p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">◎</div>
              <h3>Smart Creator Discovery</h3>
              <p>AI searches YouTube to find creators that match your brand, niche, and audience criteria.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">◌</div>
              <h3>AI Fit Scoring</h3>
              <p>Every creator gets a 0-100 score based on niche match, engagement, and content consistency.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✦</div>
              <h3>Personalized Outreach</h3>
              <p>Generate tailored email templates that feel human and improve response rates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">▣</div>
              <h3>Negotiation Support</h3>
              <p>Track terms, commission rates, and agreement status in one organized view.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">▤</div>
              <h3>Performance Tracking</h3>
              <p>Monitor deliverables, live links, and ROI without spreadsheet chaos.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⬢</div>
              <h3>Brand Safety</h3>
              <p>Maintain do-not-contact lists and vet creators before every campaign launch.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">From brief to results in four simple steps.</p>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Define Your Brief</h3>
              <p>Tell AI what you need: niche, audience, budget, and campaign goals.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Review Creators</h3>
              <p>Get a ranked list with fit scores, then approve who should be contacted.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Approve Outreach</h3>
              <p>Review AI-generated emails and approve the versions you want sent.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Results</h3>
              <p>Monitor replies, negotiate deals, and keep deliverables on schedule.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="container">
          <h2 className="section-title">Simple pricing</h2>
          <div className="pricing-card">
            <div className="pricing-header">
              <div className="price">$1,500</div>
              <p className="price-subtitle">Per month, flat rate. No hidden usage charges.</p>
            </div>
            <Link href="#cta" className="btn btn-primary btn-block">Start Free Trial</Link>
            <div className="pricing-included">
              <h3>Everything included</h3>
              <ul className="pricing-features">
                <li>• Unlimited creator searches</li>
                <li>• AI-powered fit scoring</li>
                <li>• Personalized email generation</li>
                <li>• Negotiation tracking</li>
                <li>• Deliverable monitoring</li>
                <li>• Analytics dashboard</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Trusted by D2C teams</h2>
          <p className="section-subtitle">Customers use Ricoz to save time and improve campaign execution.</p>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-quote">"{testimonial.quote}"</div>
                <div className="testimonial-author">
                  <div className="testimonial-name">{testimonial.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="container">
          <h2 className="section-title">FAQ</h2>
          <p className="section-subtitle">Common questions about the platform and support.</p>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${activeFaq === index ? 'active' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{activeFaq === index ? '−' : '+'}</span>
                </button>
                <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="cta">
        <div className="container">
          <h2>Ready to scale your influencer marketing?</h2>
          <p>Join brands using Ricoz to move faster, stay organized, and get better creator matches.</p>
          <Link href="#pricing" className="btn btn-primary btn-lg">Get Started Now</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Ricoz</h4>
            </div>
            <div className="footer-section">
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
              <Link href="#how-it-works">How It Works</Link>
            </div>
            <div className="footer-section">
              <Link href="#faq">About</Link>
              <Link href="#faq">Blog</Link>
              <Link href="#faq">Contact</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Ricoz. <Link href="#faq">Privacy Policy</Link> · <Link href="#faq">Terms of Service</Link></p>
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

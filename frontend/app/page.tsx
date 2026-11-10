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
      name: "Sarah Chen",
      role: "Marketing Director, TechStyle",
      quote: "Ricoz saved us 20+ hours per week on influencer outreach. The AI scoring is incredibly accurate and our response rates have doubled.",
    },
    {
      name: "Michael Rodriguez",
      role: "Founder, GlowBeauty",
      quote: "We've scaled from 10 to 100+ influencer partnerships in just 3 months. The platform handles everything from discovery to tracking.",
    },
    {
      name: "Emily Watson",
      role: "E-commerce Manager, FitLife",
      quote: "The personalized email generation is a game-changer. Our conversion rate from outreach to partnership increased by 40%.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI find the right creators?",
      answer: "Our AI analyzes millions of YouTube creators using advanced algorithms that match based on niche, audience demographics, engagement rates, content quality, and brand safety. You can also set custom criteria like audience size, geographic location, and content themes.",
    },
    {
      question: "Can I integrate Ricoz with my existing tools?",
      answer: "Yes! Ricoz integrates with popular marketing tools like HubSpot, Salesforce, and Shopify. We also offer API access for custom integrations with your existing workflow and analytics stack.",
    },
    {
      question: "How do you ensure creator quality?",
      answer: "We use a multi-layered vetting process including AI analysis of content quality, engagement authenticity, audience demographics, and brand safety checks. You also maintain a do-not-contact list to avoid repeat contacts.",
    },
    {
      question: "What kind of support do you offer?",
      answer: "All plans include priority email support, dedicated onboarding sessions, and access to our knowledge base. Enterprise plans include a dedicated account manager and 24/7 phone support.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time with no long-term commitment. We offer a 30-day money-back guarantee so you can try Ricoz risk-free.",
    },
  ];

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo">Ricoz</div>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How it Works</Link>
            <Link href="#testimonials">Testimonials</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
          </div>
          <div className="nav-buttons">
            <Link href="/login" className="btn btn-outline">Sign In</Link>
            <Link href="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
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
          <div className="hero-illustration">
            <div className="hero-dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="mockup-content">
                <div className="mockup-stat">
                  <div className="mockup-stat-value">847</div>
                  <div className="mockup-stat-label">Creators Found</div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-value">92%</div>
                  <div className="mockup-stat-label">Avg Fit Score</div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-value">156</div>
                  <div className="mockup-stat-label">Emails Sent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need to Scale Influencer Marketing</h2>
          <p className="section-subtitle">Powerful features designed to automate and optimize your entire influencer marketing workflow</p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Discovery</h3>
              <p>AI searches YouTube to find creators that match your niche, audience, and budget requirements with 95% accuracy.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>AI Fit Scoring</h3>
              <p>Our algorithm scores creators 0-100 based on niche match (40%), engagement (35%), and content consistency (25%).</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✉️</div>
              <h3>Personalized Outreach</h3>
              <p>AI generates personalized outreach emails that convert. You approve, we send. Response rates up 40% higher.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Negotiation Support</h3>
              <p>Handle commission negotiations with confidence. Track terms, rates, and agreements all in one centralized dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Performance Tracking</h3>
              <p>Monitor deliverables, track live links, and measure ROI across all your campaigns with real-time analytics.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Brand Safety</h3>
              <p>Maintain a do-not-contact list and ensure your brand only partners with vetted, safe creators.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How Ricoz Works</h2>
          <p className="section-subtitle">From brief to partnership in 4 simple steps</p>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Define Your Brief</h3>
              <p>Tell our AI agent what you're looking for: niche, audience size, commission range, and brand tone. Set your criteria in minutes.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Review Creators</h3>
              <p>Get a ranked list of YouTube creators with fit scores. Review profiles, engagement metrics, and approve the ones you want to contact.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Approve Outreach</h3>
              <p>Review AI-generated personalized emails. Approve and we'll send them to your chosen creators. One-click or bulk approval.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Results</h3>
              <p>Monitor responses, negotiate deals, and track deliverables all in one dashboard. Real-time updates and analytics.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials">
        <div className="container">
          <h2 className="section-title">Trusted by Growing Brands</h2>
          <p className="section-subtitle">See what D2C brand owners are saying about Ricoz</p>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-quote">"{testimonial.quote}"</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonial.name.charAt(0)}</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">One flat price. Everything included. No hidden fees.</p>
          <div className="pricing-card">
            <div className="pricing-badge">Most Popular</div>
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
              <li>✓ API access</li>
            </ul>
            <Link href="/register" className="btn btn-primary btn-block">Start Free Trial</Link>
            <p className="pricing-note">30-day money-back guarantee • No credit card required</p>
          </div>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about Ricoz</p>
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

      <section className="cta">
        <div className="container">
          <h2>Ready to Scale Your Influencer Marketing?</h2>
          <p>Join hundreds of D2C brands using Ricoz to find and partner with the perfect creators. Start your free trial today.</p>
          <Link href="/register" className="btn btn-primary btn-lg">Get Started Now</Link>
          <p className="cta-note">No credit card required • 30-day money-back guarantee</p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Ricoz</h4>
              <p>AI-powered influencer marketing for D2C brands. Scale your partnerships with confidence.</p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter">𝕊</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="Instagram">📷</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
              <Link href="#how-it-works">How it Works</Link>
              <Link href="#testimonials">Testimonials</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <Link href="#">About</Link>
              <Link href="#">Blog</Link>
              <Link href="#">Careers</Link>
              <Link href="#">Contact</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
              <Link href="#">Cookie Policy</Link>
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

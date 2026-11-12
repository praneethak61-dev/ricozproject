'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StepDetail {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  bulletPoints: string[];
}

export default function LandingPage() {
  // FAQ accordion open/close state
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });

  // Active step modal
  const [selectedStepModal, setSelectedStepModal] = useState<StepDetail | null>(null);
  const [activeArrow, setActiveArrow] = useState<number | null>(null);

  // Generic info modal (Privacy, Terms, About, Blog, Contact, Feature)
  const [infoModal, setInfoModal] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const smoothScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stepDetails: StepDetail[] = [
    {
      stepNumber: 'STEP 01',
      title: 'Define Brief',
      subtitle: 'A Clearer Campaign Path',
      description: "Tell Ricoz AI what you're looking for: niche, audience, budget, and campaign goals. The AI extracts brand parameters and initiates creator discovery automatically.",
      buttonText: 'Start with Brief →',
      bulletPoints: [
        'Define product niche, audience demographics, and target geography',
        'Set budget thresholds, commission rates, and campaign deliverables',
        'AI parses brand guidelines to filter creator content style',
      ],
    },
    {
      stepNumber: 'STEP 02',
      title: 'Review Creators',
      subtitle: 'AI-Powered Discovery & Fit Scoring',
      description: 'Get a ranked list of matched YouTube creators with 0-100 fit scores based on audience alignment and content consistency. You approve who to contact.',
      buttonText: 'Review Matched Creators →',
      bulletPoints: [
        '0-100 AI fit score assessing niche match and engagement consistency',
        'Deep profile analytics including recent upload performance',
        'One-click approval or rejection with brand safety controls',
      ],
    },
    {
      stepNumber: 'STEP 03',
      title: 'Approve Outreach',
      subtitle: 'Personalized Outreach Generation',
      description: 'AI crafts tailored, high-converting email drafts personalized to each creator’s recent videos and style. Review, customize, and send with one click.',
      buttonText: 'Approve & Send Outreach →',
      bulletPoints: [
        'Personalized hooks referencing recent creator videos',
        'Custom brand tone and partnership proposition',
        'Complete human-in-the-loop review before any email is sent',
      ],
    },
    {
      stepNumber: 'STEP 04',
      title: 'Track Results',
      subtitle: 'Negotiations, Deliverables & Analytics',
      description: 'Monitor responses in real-time, negotiate deal terms and commission rates, and track live deliverable links and performance ROI in one unified dashboard.',
      buttonText: 'Track Campaign Results →',
      bulletPoints: [
        'Track conversations, negotiation status, and agreed rates',
        'Automated live link monitoring for published creator content',
        'Comprehensive ROI and performance analytics dashboard',
      ],
    },
  ];

  const handleArrowClick = (index: number) => {
    setActiveArrow(index);
    setSelectedStepModal(stepDetails[index]);
  };

  const openFeatureModal = (title: string, desc: string, icon: string) => {
    setInfoModal({
      title,
      subtitle: 'RICOZ TOOLKIT FEATURE',
      content: (
        <div>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#d1ced8', marginBottom: 20 }}>
            {desc}
          </p>
          <div style={{ background: '#25202d', borderRadius: 10, padding: 18, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#ef7729', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em', marginBottom: 6, textTransform: 'uppercase' }}>
              Capability Highlight
            </div>
            <div style={{ color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Integrated natively within the Ricoz workflow to eliminate manual spreadsheets and speed up campaign execution.
            </div>
          </div>
          <Link href="/login" className="lp-btn-orange" style={{ width: '100%', textAlign: 'center' }}>
            Start Free Trial to Access Feature
          </Link>
        </div>
      ),
    });
  };

  const openLegalModal = (type: 'privacy' | 'terms' | 'about' | 'blog' | 'contact') => {
    if (type === 'privacy') {
      setInfoModal({
        title: 'Privacy Policy',
        subtitle: 'LEGAL & COMPLIANCE',
        content: (
          <div style={{ color: '#aba7b4', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: 14 }}>
              At Ricoz, we prioritize your data privacy. We collect information only to provide and improve our influencer marketing workflow tools.
            </p>
            <p style={{ marginBottom: 14 }}>
              We do not sell your brand data or outreach contact lists to third parties. All campaign negotiations, custom email templates, and analytics are encrypted and securely stored.
            </p>
            <p>
              For privacy inquiries or data requests, contact us at <strong style={{ color: '#ffffff' }}>privacy@ricoz.com</strong>.
            </p>
          </div>
        ),
      });
    } else if (type === 'terms') {
      setInfoModal({
        title: 'Terms of Service',
        subtitle: 'LEGAL AGREEMENT',
        content: (
          <div style={{ color: '#aba7b4', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: 14 }}>
              By accessing Ricoz, you agree to comply with our Terms of Service. Ricoz provides an AI-powered influencer discovery, outreach, and campaign tracking workspace.
            </p>
            <p style={{ marginBottom: 14 }}>
              Subscriptions are billed at $1,500/month with predictable flat pricing. Users maintain full ownership of all campaign assets, briefs, and brand messaging.
            </p>
            <p>
              Full terms are available upon account registration.
            </p>
          </div>
        ),
      });
    } else if (type === 'about') {
      setInfoModal({
        title: 'About Ricoz',
        subtitle: 'OUR MISSION',
        content: (
          <div style={{ color: '#aba7b4', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: 14 }}>
              Ricoz was built to give D2C growth teams their time back. We replace manual spreadsheets, messy email inboxes, and costly agency markups with one connected AI workspace.
            </p>
            <p style={{ marginBottom: 20 }}>
              From initial creator discovery to automated outreach and live link deliverable tracking, Ricoz keeps the human decisions visible while AI handles the repetitive busywork.
            </p>
            <Link href="/login" className="lp-btn-orange" style={{ width: '100%', textAlign: 'center' }}>
              Start Free Trial
            </Link>
          </div>
        ),
      });
    } else if (type === 'blog') {
      setInfoModal({
        title: 'Ricoz Blog & Insights',
        subtitle: 'CREATOR MARKETING STRATEGY',
        content: (
          <div style={{ color: '#aba7b4', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: 14 }}>
              Explore our latest playbooks on scaling influencer partnerships for D2C brands:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#ffffff' }}>How to Find High-ROI YouTube Creators in 2026</strong></li>
              <li><strong style={{ color: '#ffffff' }}>AI Fit Scoring: What Makes a Creator Actually Convert</strong></li>
              <li><strong style={{ color: '#ffffff' }}>Why Flat-Fee Workflow Software Beats 20% Agency Markups</strong></li>
            </ul>
            <Link href="/login" className="lp-btn-orange" style={{ width: '100%', textAlign: 'center' }}>
              Sign In to Read All Articles
            </Link>
          </div>
        ),
      });
    } else if (type === 'contact') {
      setInfoModal({
        title: 'Get in Touch',
        subtitle: 'SUPPORT & SALES',
        content: (
          <div style={{ color: '#aba7b4', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: 16 }}>
              Have questions about how Ricoz fits into your brand’s workflow? Our support and partnership team is ready to assist.
            </p>
            <div style={{ background: '#25202d', borderRadius: 10, padding: 18, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>Email Support:</div>
              <div style={{ color: '#ef7729', fontWeight: 700 }}>support@ricoz.com</div>
              <div style={{ color: '#ffffff', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>Sales Inquiries:</div>
              <div style={{ color: '#ef7729', fontWeight: 700 }}>growth@ricoz.com</div>
            </div>
            <Link href="/login" className="lp-btn-orange" style={{ width: '100%', textAlign: 'center' }}>
              Start Free Trial Now
            </Link>
          </div>
        ),
      });
    }
  };

  const faqs = [
    {
      q: 'How does the AI work?',
      a: 'Ricoz analyzes creator content and campaign criteria to surface relevant matches, score fit, and draft personalized outreach for review.',
    },
    {
      q: 'Can Ricoz work with our existing tools?',
      a: 'Position Ricoz as the workflow layer for discovery, outreach, negotiations, deliverables, and analytics. Integrations will be specified once confirmed.',
    },
    {
      q: 'How do you maintain creator quality?',
      a: 'Use fit scoring, engagement signals, content consistency, vetting, and brand-safety controls to support better decisions.',
    },
    {
      q: 'What support is included?',
      a: 'Priority support is included with the $1,500/month plan.',
    },
    {
      q: 'Can we cancel?',
      a: 'Cancellation policy to be confirmed before launch.',
    },
  ];

  return (
    <div className="landing-root">
      {/* ─── TOP NAVIGATION ─── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-brand">
            <span className="lp-brand-text">RICOZ</span>
            <span className="lp-brand-dot"></span>
          </Link>
          <nav className="lp-nav-links">
            <button type="button" onClick={() => smoothScrollTo('workflow')} className="lp-nav-link-btn">
              Workflow
            </button>
            <button type="button" onClick={() => smoothScrollTo('toolkit')} className="lp-nav-link-btn">
              Features
            </button>
            <button type="button" onClick={() => smoothScrollTo('steps')} className="lp-nav-link-btn">
              How It Works
            </button>
            <button type="button" onClick={() => smoothScrollTo('pricing')} className="lp-nav-link-btn">
              Pricing
            </button>
            <button type="button" onClick={() => smoothScrollTo('testimonials')} className="lp-nav-link-btn">
              Reviews
            </button>
            <button type="button" onClick={() => smoothScrollTo('faq')} className="lp-nav-link-btn">
              FAQ
            </button>
          </nav>
          <div className="lp-nav-actions">
            <Link href="/login" className="lp-nav-login">
              Log In
            </Link>
            <Link href="/login" className="lp-nav-trial">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SLIDE 1: HERO SECTION ─── */}
      <section id="hero" className="lp-hero-section">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-text">
            <div className="lp-eyebrow">RICOZ · AI-POWERED CREATOR MARKETING</div>
            <h1 className="lp-hero-title">
              Influencer<br />
              marketing,<br />
              run by AI
            </h1>
            <p className="lp-hero-desc">
              Ricoz helps D2C brands find the right creators, automate outreach, and track every campaign from one workspace.
            </p>
            <div className="lp-hero-cta-group">
              <Link href="/login" className="lp-btn-orange">
                Start Free Trial
              </Link>
              <button
                type="button"
                onClick={() => smoothScrollTo('steps')}
                className="lp-btn-outline"
              >
                See How It Works
              </button>
            </div>
            <div className="lp-hero-stat">
              10K+ CREATORS INDEXED
            </div>
          </div>

          <div className="lp-hero-media">
            <div className="lp-hero-image-wrap">
              <img
                src="/images/hero_diorama.png"
                alt="Ricoz AI-powered creator marketing miniature diorama scene"
                className="lp-hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 2: THE WORKFLOW LAYER ─── */}
      <section id="workflow" className="lp-workflow-section">
        <div className="lp-container lp-workflow-grid">
          <div className="lp-workflow-text">
            <div className="lp-eyebrow orange">THE WORKFLOW LAYER</div>
            <h2 className="lp-section-title">
              One platform for the work behind every creator partnership
            </h2>
            <p className="lp-section-desc">
              Replace scattered spreadsheets, inbox threads, and manual follow-up with an AI-powered influencer workflow.
            </p>

            <div className="lp-feature-rows">
              {/* Feature 1 */}
              <div
                className="lp-feature-row clickable"
                onClick={() => openFeatureModal('Discover faster', 'AI searches YouTube to surface creators who fit your niche, target audience demographics, and brand criteria.', 'search')}
              >
                <div className="lp-feature-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="lp-feature-info">
                  <h3 className="lp-feature-title">Discover faster</h3>
                  <p className="lp-feature-sub">Find creators who fit your niche, audience, and brand criteria.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div
                className="lp-feature-row clickable"
                onClick={() => openFeatureModal('Move without busywork', 'Go from campaign brief to personalized outreach in a few focused steps, automating research and email drafting.', 'mail')}
              >
                <div className="lp-feature-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="lp-feature-info">
                  <h3 className="lp-feature-title">Move without busywork</h3>
                  <p className="lp-feature-sub">Go from brief to personalized outreach in a few focused steps.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div
                className="lp-feature-row clickable"
                onClick={() => openFeatureModal('See what delivers', 'Keep progress, live links, deliverables, and ROI in one place instead of scattered spreadsheets and inboxes.', 'megaphone')}
              >
                <div className="lp-feature-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 11 15-5v12L3 13v-2z" />
                    <path d="M12 16a3 3 0 0 1-3 3H7" />
                    <path d="M18 8h3" />
                    <path d="M18 12h3" />
                  </svg>
                </div>
                <div className="lp-feature-info">
                  <h3 className="lp-feature-title">See what delivers</h3>
                  <p className="lp-feature-sub">Keep progress, live links, deliverables, and ROI in one place.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-workflow-media">
            <div className="lp-diorama-card">
              <img
                src="/images/workflow_diorama.png"
                alt="Workflow layer corkboard diorama"
                className="lp-diorama-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 3: THE RICOZ TOOLKIT ─── */}
      <section id="toolkit" className="lp-toolkit-section">
        <div className="lp-container">
          <div className="lp-toolkit-header">
            <div className="lp-eyebrow orange">THE RICOZ TOOLKIT</div>
            <h2 className="lp-section-title">Everything you need to scale creator campaigns</h2>
            <p className="lp-section-desc max-700">
              One connected system for finding partners, starting conversations, managing terms, and measuring the work after it goes live.
            </p>
          </div>

          <div className="lp-toolkit-grid">
            {/* Card 1 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('Smart Creator Discovery', 'AI searches YouTube for creators that match your niche, audience, and brand criteria.', 'discovery')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  <circle cx="8.5" cy="12" r="2.5" />
                </svg>
              </div>
              <h3 className="lp-card-title">Smart Creator Discovery</h3>
              <p className="lp-card-desc">
                AI searches YouTube for creators that match your niche, audience, and brand criteria.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('AI Fit Scoring', 'Every creator gets a 0-100 score based on niche match, engagement, and content consistency.', 'scoring')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="13" rx="2" />
                  <path d="M7 8h3m-3 3h5m-5 3h2" />
                  <circle cx="16" cy="10" r="2" />
                  <line x1="12" y1="16" x2="12" y2="21" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                </svg>
              </div>
              <h3 className="lp-card-title">AI Fit Scoring</h3>
              <p className="lp-card-desc">
                Every creator gets a 0-100 score based on niche match, engagement, and content consistency.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('Personalized Outreach', 'Generate tailored email templates that sound like your brand and reference creator videos.', 'outreach')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className="lp-card-title">Personalized Outreach</h3>
              <p className="lp-card-desc">
                Generate tailored email templates that sound like your brand.
              </p>
            </div>

            {/* Card 4 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('Negotiation Support', 'Track terms, commission rates, and agreements as conversations progress in real time.', 'negotiation')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="lp-card-title">Negotiation Support</h3>
              <p className="lp-card-desc">
                Track terms, commission rates, and agreements as conversations progress.
              </p>
            </div>

            {/* Card 5 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('Performance Tracking', 'Monitor deliverables, live links, responses, and ROI across every campaign.', 'tracking')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 11 15-5v12L3 13v-2z" />
                  <path d="M12 16a3 3 0 0 1-3 3H7" />
                  <line x1="21" y1="8" x2="21" y2="16" />
                </svg>
              </div>
              <h3 className="lp-card-title">Performance Tracking</h3>
              <p className="lp-card-desc">
                Monitor deliverables, live links, responses, and ROI.
              </p>
            </div>

            {/* Card 6 */}
            <div
              className="lp-card clickable"
              onClick={() => openFeatureModal('Brand Safety', 'Vet creators and maintain an active do-not-contact list to protect your brand reputation.', 'safety')}
            >
              <div className="lp-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="lp-card-title">Brand Safety</h3>
              <p className="lp-card-desc">
                Vet creators and maintain a do-not-contact list.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 4: A CLEARER CAMPAIGN PATH (ACTIVATED 4 ARROWS) ─── */}
      <section id="steps" className="lp-steps-section">
        <div className="lp-container lp-steps-grid">
          <div className="lp-steps-text">
            <div className="lp-eyebrow orange">A CLEARER CAMPAIGN PATH</div>
            <h2 className="lp-section-title">
              From brief to live campaign in four clear steps
            </h2>
            <p className="lp-section-desc">
              Ricoz keeps the human decisions visible while AI handles the repetitive work around them. Click any step to explore how it works:
            </p>

            {/* Fully Activated Interactive Orange Arrow Blocks */}
            <div className="lp-arrow-stack">
              <button
                type="button"
                onClick={() => handleArrowClick(0)}
                className={`lp-arrow-item arrow-1 ${activeArrow === 0 ? 'active' : ''}`}
                aria-label="Activate step 1: Define Brief"
              >
                <span className="lp-arrow-label">Define Brief</span>
                <span className="lp-arrow-interactive-hint">Explore →</span>
              </button>

              <button
                type="button"
                onClick={() => handleArrowClick(1)}
                className={`lp-arrow-item arrow-2 ${activeArrow === 1 ? 'active' : ''}`}
                aria-label="Activate step 2: Review Creators"
              >
                <span className="lp-arrow-label">Review Creators</span>
                <span className="lp-arrow-interactive-hint">Explore →</span>
              </button>

              <button
                type="button"
                onClick={() => handleArrowClick(2)}
                className={`lp-arrow-item arrow-3 ${activeArrow === 2 ? 'active' : ''}`}
                aria-label="Activate step 3: Approve Outreach"
              >
                <span className="lp-arrow-label">Approve Outreach</span>
                <span className="lp-arrow-interactive-hint">Explore →</span>
              </button>

              <button
                type="button"
                onClick={() => handleArrowClick(3)}
                className={`lp-arrow-item arrow-4 ${activeArrow === 3 ? 'active' : ''}`}
                aria-label="Activate step 4: Track Results"
              >
                <span className="lp-arrow-label">Track Results</span>
                <span className="lp-arrow-interactive-hint">Explore →</span>
              </button>
            </div>
          </div>

          <div className="lp-steps-media">
            <div className="lp-diorama-card">
              <img
                src="/images/steps_diorama.png"
                alt="Campaign path desk diorama"
                className="lp-diorama-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 5: SIMPLE, PREDICTABLE PRICING ─── */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-container lp-pricing-grid">
          <div className="lp-pricing-text">
            <div className="lp-eyebrow orange">SIMPLE, PREDICTABLE PRICING</div>
            <h2 className="lp-pricing-headline">
              One flat<br />
              price.<br />
              No agency<br />
              markup.
            </h2>
            <p className="lp-pricing-sub">
              Everything Ricoz offers is included in one predictable subscription.
            </p>
            <div className="lp-pricing-cta-wrap">
              <Link href="/login" className="lp-btn-orange">
                Start Free Trial
              </Link>
            </div>
          </div>

          <div className="lp-pricing-card-wrap">
            <div className="lp-pricing-card">
              <div className="lp-pricing-card-plan">THE RICOZ PLAN</div>
              <div className="lp-pricing-amount">$1,500</div>
              <div className="lp-pricing-period">PER MONTH</div>

              <div className="lp-pricing-divider"></div>

              <ul className="lp-pricing-list">
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Unlimited creator searches</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>AI-powered fit scoring</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Personalized email generation</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Negotiation tracking</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Deliverable monitoring</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Analytics dashboard</span>
                </li>
                <li className="lp-pricing-item">
                  <span className="lp-check">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 6: TIME BACK FOR GROWTH (TESTIMONIALS / QUOTES) ─── */}
      <section id="testimonials" className="lp-testimonials-section">
        <div className="lp-container">
          <div className="lp-testimonials-header">
            <div className="lp-eyebrow orange">TIME BACK FOR GROWTH</div>
            <h2 className="lp-section-title">Built to give growth teams their time back</h2>
            <p className="lp-section-desc max-700">
              Illustrative customer feedback shows the moments Ricoz is designed to improve. Customer names and quotes remain placeholders until approved.
            </p>
          </div>

          <div className="lp-quotes-grid">
            {/* Quote Card 1 */}
            <div className="lp-quote-card">
              <div className="lp-quote-badge">ILLUSTRATIVE QUOTE</div>
              <div className="lp-quote-body">
                <p className="lp-quote-text">
                  &ldquo;Ricoz turned a week of creator research into an afternoon.&rdquo;
                </p>
              </div>
              <div className="lp-quote-author">D2C BRAND FOUNDER</div>
            </div>

            {/* Quote Card 2 */}
            <div className="lp-quote-card">
              <div className="lp-quote-badge">ILLUSTRATIVE QUOTE</div>
              <div className="lp-quote-body">
                <p className="lp-quote-text">
                  &ldquo;The fit scores made it easier to focus on creators who could actually move product.&rdquo;
                </p>
              </div>
              <div className="lp-quote-author">CONSUMER BRAND GROWTH LEAD</div>
            </div>

            {/* Quote Card 3 */}
            <div className="lp-quote-card">
              <div className="lp-quote-badge">ILLUSTRATIVE QUOTE</div>
              <div className="lp-quote-body">
                <p className="lp-quote-text">
                  &ldquo;We finally have one place to see outreach, negotiations, and live deliverables.&rdquo;
                </p>
              </div>
              <div className="lp-quote-author">ECOMMERCE MARKETING DIRECTOR</div>
            </div>

            {/* Quote Card 4 */}
            <div className="lp-quote-card">
              <div className="lp-quote-badge">ILLUSTRATIVE QUOTE</div>
              <div className="lp-quote-body">
                <p className="lp-quote-text">
                  &ldquo;The flat monthly fee makes scaling predictable.&rdquo;
                </p>
              </div>
              <div className="lp-quote-author">FOUNDER, GROWING D2C BRAND</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 7: QUESTIONS, ANSWERED (FAQ) ─── */}
      <section id="faq" className="lp-faq-section">
        <div className="lp-container">
          <div className="lp-faq-header">
            <div className="lp-eyebrow orange">FAQ · RICOZ</div>
            <h2 className="lp-section-title">Questions, answered</h2>
          </div>

          <div className="lp-faq-list">
            {faqs.map((item, idx) => {
              const isOpen = openFaqs[idx] ?? true;
              return (
                <div key={idx} className="lp-faq-item">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="lp-faq-question-btn"
                    aria-expanded={isOpen}
                  >
                    <span className={`lp-faq-indicator ${isOpen ? 'open' : ''}`}>▼</span>
                    <span className="lp-faq-question-text">{item.q}</span>
                  </button>
                  {isOpen && (
                    <div className="lp-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SLIDE 8: READY TO SCALE YOUR INFLUENCER MARKETING? (CTA) ─── */}
      <section id="cta" className="lp-cta-section">
        <div className="lp-container lp-cta-grid">
          <div className="lp-cta-text">
            <div className="lp-eyebrow">YOUR NEXT CAMPAIGN STARTS HERE</div>
            <h2 className="lp-cta-headline">
              Ready to scale<br />
              your influencer<br />
              marketing?
            </h2>
            <p className="lp-cta-desc">
              Join ambitious D2C brands using Ricoz to find better creator partners, move faster, and see what every campaign delivers.
            </p>
            <div className="lp-cta-btn-wrap">
              <Link href="/login" className="lp-btn-orange">
                Get Started Now
              </Link>
            </div>
          </div>

          <div className="lp-cta-media">
            <div className="lp-cta-image-wrap">
              <img
                src="/images/cta_diorama.png"
                alt="Ready to scale influencer marketing diorama tunnel"
                className="lp-cta-img"
              />
              <div className="lp-cta-highlights">
                <span className="lp-cta-tag">FIND BETTER PARTNERS</span>
                <span className="lp-cta-tag">MOVE FASTER</span>
                <span className="lp-cta-tag">SEE WHAT DELIVERS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SLIDE 9: FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            {/* Brand Column */}
            <div className="lp-footer-col lp-footer-brand-col">
              <h3 className="lp-footer-brand-name">RICOZ</h3>
              <p className="lp-footer-tagline">
                AI-POWERED INFLUENCER MARKETING FOR D2C BRANDS.
              </p>
              <p className="lp-footer-copyright">
                &copy; RICOZ. ALL RIGHTS RESERVED.
              </p>
            </div>

            {/* Explore Column */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">EXPLORE</h4>
              <ul className="lp-footer-nav">
                <li><button type="button" onClick={() => smoothScrollTo('toolkit')} className="lp-footer-btn">Features</button></li>
                <li><button type="button" onClick={() => smoothScrollTo('pricing')} className="lp-footer-btn">Pricing</button></li>
                <li><button type="button" onClick={() => smoothScrollTo('steps')} className="lp-footer-btn">How It Works</button></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">COMPANY</h4>
              <ul className="lp-footer-nav">
                <li><button type="button" onClick={() => openLegalModal('about')} className="lp-footer-btn">About</button></li>
                <li><button type="button" onClick={() => openLegalModal('blog')} className="lp-footer-btn">Blog</button></li>
                <li><button type="button" onClick={() => openLegalModal('contact')} className="lp-footer-btn">Contact</button></li>
              </ul>
            </div>
          </div>

          {/* Follow & Legal Row */}
          <div className="lp-footer-bottom-grid">
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">FOLLOW</h4>
              <ul className="lp-footer-nav horizontal">
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a></li>
              </ul>
              <div className="lp-footer-legal-links">
                <button type="button" onClick={() => openLegalModal('privacy')} className="lp-legal-btn">
                  PRIVACY POLICY
                </button>
                <span className="lp-legal-sep">·</span>
                <button type="button" onClick={() => openLegalModal('terms')} className="lp-legal-btn">
                  TERMS OF SERVICE
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── INTERACTIVE STEP DETAIL MODAL (FOR 4 STEP ARROWS) ─── */}
      {selectedStepModal && (
        <div className="lp-modal-backdrop" onClick={() => setSelectedStepModal(null)}>
          <div className="lp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lp-modal-close"
              onClick={() => setSelectedStepModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="lp-modal-eyebrow">{selectedStepModal.stepNumber} · {selectedStepModal.subtitle}</div>
            <h3 className="lp-modal-title">{selectedStepModal.title}</h3>
            <p className="lp-modal-desc">{selectedStepModal.description}</p>

            <div className="lp-modal-checklist">
              <div className="lp-modal-checklist-title">WHAT HAPPENS IN THIS STEP:</div>
              {selectedStepModal.bulletPoints.map((pt, i) => (
                <div key={i} className="lp-modal-check-item">
                  <span className="lp-modal-check-icon">✓</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="lp-modal-actions">
              <Link href="/login" className="lp-btn-orange" style={{ width: '100%', textAlign: 'center' }}>
                {selectedStepModal.buttonText}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── GENERIC INFO & LEGAL MODAL ─── */}
      {infoModal && (
        <div className="lp-modal-backdrop" onClick={() => setInfoModal(null)}>
          <div className="lp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lp-modal-close"
              onClick={() => setInfoModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="lp-modal-eyebrow">{infoModal.subtitle}</div>
            <h3 className="lp-modal-title">{infoModal.title}</h3>
            <div className="lp-modal-body">{infoModal.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}

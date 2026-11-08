'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Overview {
  brands: number;
  totalCreators: number;
  sentOutreach: number;
  totalCampaigns: number;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  actionLink: string;
  actionLabel: string;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/overview');
        setOverview(res.data.overview);
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = overview || {
    brands: 0,
    totalCreators: 0,
    sentOutreach: 0,
    totalCampaigns: 0,
  };

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Create your brand profile',
      description: 'Set up your brand with niche, target audience, and preferences for better creator matches.',
      completed: stats.brands > 0,
      actionLink: '/brands',
      actionLabel: stats.brands > 0 ? 'View Brands' : 'Create Brand',
    },
    {
      id: 2,
      title: 'Set up your first campaign',
      description: 'Create a campaign to organize your influencer outreach efforts and track progress.',
      completed: stats.totalCampaigns > 0,
      actionLink: '/campaigns',
      actionLabel: stats.totalCampaigns > 0 ? 'View Campaigns' : 'Create Campaign',
    },
    {
      id: 3,
      title: 'Use the AI agent to find creators',
      description: 'Tell the agent what you\'re looking for and it will find and rank YouTube creators for you.',
      completed: stats.totalCreators > 0,
      actionLink: '/agent',
      actionLabel: stats.totalCreators > 0 ? 'Find More' : 'Ask the Agent',
    },
    {
      id: 4,
      title: 'Review and approve creators',
      description: 'Browse discovered creators, review their fit scores, and approve the ones you want to contact.',
      completed: stats.totalCreators > 0,
      actionLink: '/brands',
      actionLabel: 'Review Creators',
    },
    {
      id: 5,
      title: 'Send personalized outreach',
      description: 'Generate AI-powered personalized emails and send them to approved creators.',
      completed: stats.sentOutreach > 0,
      actionLink: '/brands',
      actionLabel: stats.sentOutreach > 0 ? 'View Outreach' : 'Start Outreach',
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (loading) {
    return <div className="loading-page"><span className="spinner" /> Loading onboarding...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome to Ricoz, {user?.name}!</h1>
        <p className="page-subtitle">Follow these steps to get started with influencer marketing for your brand.</p>
      </div>

      {/* Progress Overview */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Progress</h2>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {completedSteps}/{steps.length}
          </span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {progressPercentage === 100 ? '🎉 You\'re all set! Start using Ricoz to grow your brand.' : `Complete ${steps.length - completedSteps} more step${steps.length - completedSteps === 1 ? '' : 's'} to finish onboarding.`}
        </p>
      </div>

      {/* Onboarding Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="card"
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              padding: '24px',
              opacity: step.completed ? 0.7 : 1,
              borderLeft: step.completed ? '4px solid var(--success)' : '4px solid var(--accent)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step.completed ? 'var(--success-bg)' : 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0,
              }}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                {step.title}
                {step.completed && (
                  <span className="badge badge-success" style={{ marginLeft: 12 }}>Completed</span>
                )}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, lineHeight: 1.6 }}>
                {step.description}
              </p>
              <Link href={step.actionLink} className="btn btn-primary btn-sm">
                {step.actionLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="card" style={{ marginTop: 32, background: 'var(--gradient-card)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>💡 Pro Tips</h2>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Be specific with your brief</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                The more details you provide about your ideal creators (niche, audience size, content style), the better the agent can find matches.
              </p>
            </div>
          </li>
          <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Review fit scores carefully</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                Each creator is scored 0-100 based on niche match, engagement, and consistency. Higher scores mean better alignment with your brand.
              </p>
            </div>
          </li>
          <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>✉️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Personalize your outreach</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                The AI generates personalized emails based on each creator's content. Always review and customize before sending.
              </p>
            </div>
          </li>
          <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>🔄</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Follow up strategically</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                If creators don't respond, use the follow-up feature to send a gentle reminder. Don't spam – space out your follow-ups.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Help Section */}
      <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Need help?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          Check out our documentation or contact support if you have any questions.
        </p>
        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <Link href="/plan" className="btn btn-outline">View Pricing</Link>
          <Link href="/" className="btn btn-outline">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

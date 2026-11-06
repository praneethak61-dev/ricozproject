'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PlanPayload {
  plan: {
    name: string;
    priceMonthly: number;
    currency: string;
    status: string;
    audience: string;
    includes: string[];
  };
  usage: {
    periodStart: string;
    searches: number;
    emailsSent: number;
    dealsClosed: number;
    deliverablesLive: number;
  };
}

export default function PlanPage() {
  const [data, setData] = useState<PlanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/billing')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load the plan'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading plan...</div>;
  if (error || !data) return <div className="alert alert-error">{error || 'Plan unavailable'}</div>;

  const month = new Date(data.usage.periodStart).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const usage = [
    { label: 'Searches run', value: data.usage.searches },
    { label: 'Emails sent', value: data.usage.emailsSent },
    { label: 'Deals closed', value: data.usage.dealsClosed },
    { label: 'Live deliverables', value: data.usage.deliverablesLive },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Plan</h1>
        <p className="page-subtitle">One flat fee for D2C brands. The agent is included. You are not billed a percent of creator sales.</p>
      </div>

      <div className="two-col">
        <div className="card">
          <span className="badge badge-success">{data.plan.status}</span>
          <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{data.plan.name}</div>
          <div className="plan-price">${data.plan.priceMonthly.toLocaleString()}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/mo</span></div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px' }}>{data.plan.audience}</p>
          <ul style={{ paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {data.plan.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: 6 }}>Usage in {month}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>Counts reset on the first of each month. The fee stays $1,500 either way.</p>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            {usage.map((item) => (
              <div key={item.label} className="stat-card">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

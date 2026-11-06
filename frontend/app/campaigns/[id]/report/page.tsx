'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface Named {
  channelTitle?: string;
}

interface ReportCreator {
  creatorId: { channelTitle?: string; subscriberCount?: number; fitScore?: number; sample?: boolean; status?: string } | string;
  stage: string;
  commissionRate?: number;
}

interface ReportCampaign {
  name: string;
  goal: string;
  budget: number;
  commissionMin: number;
  commissionMax: number;
  createdAt: string;
  creators: ReportCreator[];
  brandId: { name?: string; niche?: string; productPrice?: number } | string;
}

interface OutreachRow {
  subject: string;
  status: string;
  creatorId: Named | string;
}

interface DeliverableRow {
  title: string;
  status: string;
  linkUrl: string;
  creatorId: Named | string;
}

interface DealRow {
  status: string;
  finalRate?: number;
  currentOffer: number;
  creatorId: Named | string;
}

function nameOf(value: { channelTitle?: string } | string | undefined): string {
  if (!value || typeof value === 'string') return 'Creator';
  return value.channelTitle || 'Creator';
}

function ReportContent() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<ReportCampaign | null>(null);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/campaigns/${campaignId}/report`)
      .then((res) => {
        setCampaign(res.data.campaign);
        setOutreach(res.data.outreach || []);
        setDeliverables(res.data.deliverables || []);
        setDeals(res.data.negotiations || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the report'));
  }, [campaignId]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!campaign) return <div className="loading-page"><span className="spinner" /> Building the report...</div>;

  const brand = typeof campaign.brandId === 'object' ? campaign.brandId : null;
  const posted = deliverables.filter((item) => item.status === 'live');
  const emailed = outreach.filter((item) => item.status === 'sent');

  return (
    <div className="report-sheet">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link href={`/campaigns/${campaignId}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Campaign</Link>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => window.print()}>Print report</button>
      </div>
      <p className="report-kicker">Ricoz campaign report</p>
      <h1 className="page-title">{brand?.name || 'Brand'} · {campaign.name}</h1>
      <p className="page-subtitle">{campaign.goal}</p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Commission {campaign.commissionMin}% to {campaign.commissionMax}% · product guess ${brand?.productPrice || 25} · prepared {new Date(campaign.createdAt).toLocaleDateString()}
      </p>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-value">{campaign.creators.length}</div><div className="stat-label">On the list</div></div>
        <div className="stat-card"><div className="stat-value">{emailed.length}</div><div className="stat-label">Emails sent</div></div>
        <div className="stat-card"><div className="stat-value">{deals.filter((d) => d.status === 'agreed').length}</div><div className="stat-label">Deals agreed</div></div>
        <div className="stat-card"><div className="stat-value">{posted.length}</div><div className="stat-label">Posts live</div></div>
      </div>

      <h2>Creators</h2>
      <table className="report-table">
        <thead><tr><th>Name</th><th>Subscribers</th><th>Fit</th><th>Stage</th><th>Rate</th></tr></thead>
        <tbody>
          {campaign.creators.map((entry, index) => {
            const creator = typeof entry.creatorId === 'object' ? entry.creatorId : null;
            return (
              <tr key={index}>
                <td>{creator?.channelTitle || 'Creator'}{creator?.sample ? ' (sample)' : ''}</td>
                <td>{(creator?.subscriberCount || 0).toLocaleString()}</td>
                <td>{creator?.fitScore ?? '—'}</td>
                <td>{entry.stage}</td>
                <td>{entry.commissionRate !== undefined ? `${entry.commissionRate}%` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Emails</h2>
      {outreach.length === 0 ? <p>No emails yet.</p> : (
        <ul>{outreach.map((item, index) => <li key={index}>{nameOf(item.creatorId)} — {item.status} — {item.subject}</li>)}</ul>
      )}

      <h2>Who posted</h2>
      {posted.length === 0 ? <p>No live posts yet.</p> : (
        <ul>{posted.map((item, index) => <li key={index}>{nameOf(item.creatorId)} — {item.linkUrl || item.title}</li>)}</ul>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Building the report...</div>}>
      <ReportContent />
    </Suspense>
  );
}

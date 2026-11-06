'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface OutreachEntry {
  _id: string;
  creatorId: { channelTitle?: string; channelId?: string; fitScore?: number } | string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  followUpCount: number;
  maxFollowUps: number;
  isTestEmail: boolean;
}

interface DNCEntry {
  _id: string;
  email: string;
  reason: string;
  createdAt: string;
}

interface Brand {
  _id: string;
  name: string;
}

function OutreachContent() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [dncList, setDncList] = useState<DNCEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showDNC, setShowDNC] = useState(false);
  const [dncEmail, setDncEmail] = useState('');
  const [dncReason, setDncReason] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [brandId]);

  async function loadData() {
    try {
      const brandRes = await api.get(`/brands/${brandId}`);
      setBrand(brandRes.data.brand);
      const outreachRes = await api.get(`/outreach/${brandId}`);
      setOutreach(outreachRes.data.outreach || []);
      const dncRes = await api.get('/outreach/dnc/list');
      setDncList(dncRes.data.dncList || []);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/outreach/${brandId}/generate`);
      setSuccessMsg(res.data.message);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate outreach');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(id: string) {
    try {
      await api.post(`/outreach/${id}/send`);
      setSuccessMsg('Email sent to test address!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send');
    }
  }

  async function handleFollowUp(id: string) {
    try {
      await api.post(`/outreach/${id}/followup`);
      setSuccessMsg('Follow-up generated!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Follow-up failed');
    }
  }

  async function handleAddDNC(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/outreach/dnc/add', { email: dncEmail, reason: dncReason });
      setDncEmail('');
      setDncReason('');
      setSuccessMsg('Added to do-not-contact list');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add to DNC');
    }
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading...</div>;

  const creatorName = (entry: OutreachEntry) => {
    if (typeof entry.creatorId === 'object' && entry.creatorId?.channelTitle) {
      return entry.creatorId.channelTitle;
    }
    return 'Creator';
  };

  return (
    <div>
      <div className="page-header">
        <Link href="/brands" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Brands</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>Outreach{brand ? ` — ${brand.name}` : ''}</h1>
        <p className="page-subtitle">Generate and send personalized emails to approved creators</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><span className="spinner" /> Generating emails...</> : '✨ Generate Outreach Emails'}
        </button>
        <Link href={`/discovery/${brandId}`} className="btn btn-outline">🔍 Discovery</Link>
        <button className="btn btn-outline" onClick={() => setShowDNC(!showDNC)}>
          🚫 Do-Not-Contact ({dncList.length})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* DNC Panel */}
      {showDNC && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Do-Not-Contact List</h3>
          <form onSubmit={handleAddDNC} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="form-input" style={{ flex: 1, minWidth: 200 }} value={dncEmail} onChange={(e) => setDncEmail(e.target.value)} placeholder="Email to block" type="email" required />
            <input className="form-input" style={{ flex: 1, minWidth: 200 }} value={dncReason} onChange={(e) => setDncReason(e.target.value)} placeholder="Reason (optional)" />
            <button type="submit" className="btn btn-danger btn-sm">Add to DNC</button>
          </form>
          {dncList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No entries in do-not-contact list.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Email</th><th>Reason</th><th>Added</th></tr>
                </thead>
                <tbody>
                  {dncList.map((d) => (
                    <tr key={d._id}>
                      <td>{d.email}</td>
                      <td>{d.reason}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outreach List */}
      {outreach.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✉️</div>
          <div className="empty-state-title">No outreach emails yet</div>
          <p>Approve creators in Discovery, then click &quot;Generate Outreach Emails&quot;.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {outreach.map((entry) => (
            <div key={entry._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>To: {creatorName(entry)}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Test recipient: {entry.recipientEmail}
                    {entry.followUpCount > 0 && ` • Follow-up ${entry.followUpCount}/${entry.maxFollowUps}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${entry.status === 'sent' ? 'badge-success' : entry.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                    {entry.status.toUpperCase()}
                  </span>
                  {entry.isTestEmail && <span className="badge badge-neutral">TEST</span>}
                </div>
              </div>

              <button className="btn btn-outline btn-sm" style={{ marginBottom: 8 }} onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}>
                {expandedId === entry._id ? '▼ Hide' : '► Preview'} Email
              </button>

              {expandedId === entry._id && (
                <div className="email-preview">
                  <div className="email-subject">Subject: {entry.subject}</div>
                  <div className="email-body">{entry.body}</div>
                </div>
              )}

              <div className="btn-group" style={{ marginTop: 12 }}>
                {entry.status === 'draft' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleSend(entry._id)}>📤 Send Test Email</button>
                )}
                {entry.followUpCount < entry.maxFollowUps && entry.status === 'sent' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleFollowUp(entry._id)}>🔄 Generate Follow-up</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Loading...</div>}>
      <OutreachContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

type Stage = 'discovered' | 'contacted' | 'responded' | 'negotiating' | 'contracted';

interface CreatorRef {
  _id: string;
  channelTitle: string;
  platform?: string;
  fitScore?: number;
  subscriberCount?: number;
  thumbnailUrl?: string;
}

interface PipelineCreator {
  creatorId: CreatorRef | string;
  stage: Stage;
  commissionRate?: number;
  agreedTerms?: string;
}

interface Campaign {
  _id: string;
  name: string;
  goal: string;
  budget: number;
  commissionMin: number;
  commissionMax: number;
  status: string;
  creators: PipelineCreator[];
  brandId: { _id: string; name: string } | string;
}

interface NegMessage {
  role: 'brand' | 'creator' | 'ai_agent';
  message: string;
  proposedRate?: number;
  timestamp: string;
}

interface Negotiation {
  _id: string;
  status: string;
  commissionMin: number;
  commissionMax: number;
  currentOffer: number;
  finalRate?: number;
  currentRound: number;
  maxRounds: number;
  creatorId: CreatorRef | string;
  messages: NegMessage[];
}

interface Deliverable {
  _id: string;
  title: string;
  type: string;
  status: string;
  linkUrl: string;
  trackingUrl: string;
  dueDate: string;
  notes: string;
  creatorId: CreatorRef | string;
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'discovered', label: 'Discovered' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'responded', label: 'Responded' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'contracted', label: 'Contracted' },
];

function creatorOf(value: CreatorRef | string | undefined): CreatorRef | null {
  if (!value || typeof value === 'string') return null;
  return value;
}

function creatorIdOf(value: CreatorRef | string | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id;
}

function CampaignContent() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [counterRate, setCounterRate] = useState(18);
  const [counterMessage, setCounterMessage] = useState('');
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [pastedReply, setPastedReply] = useState('');

  useEffect(() => { load(); }, [campaignId]);

  async function load() {
    try {
      const [campaignRes, negRes, delRes] = await Promise.all([
        api.get(`/campaigns/${campaignId}`),
        api.get(`/negotiations/campaign/${campaignId}`),
        api.get(`/deliverables/campaign/${campaignId}`),
      ]);
      setCampaign(campaignRes.data.campaign);
      setNegotiations(negRes.data.negotiations || []);
      setDeliverables(delRes.data.deliverables || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load this campaign');
    } finally {
      setLoading(false);
    }
  }

  function negotiationFor(creatorId: string) {
    return negotiations.find((n) => creatorIdOf(n.creatorId) === creatorId);
  }

  async function moveStage(creatorId: string, stage: Stage) {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/campaigns/${campaignId}/creators/${creatorId}/stage`, { stage });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not move this creator');
    } finally {
      setBusy(false);
    }
  }

  async function startNegotiation(creatorId: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post('/negotiations', { campaignId, creatorId });
      setSelectedId(creatorId);
      setNotice(res.data.message || 'Negotiation started');
      await load();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.negotiation) {
        setSelectedId(creatorId);
        setNotice('This creator already has an open negotiation.');
        await load();
      } else {
        setError(err.response?.data?.message || 'Could not start negotiation');
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendCounter(negotiationId: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post(`/negotiations/${negotiationId}/counter`, {
        counterRate: Number(counterRate),
        message: counterMessage,
      });
      if (res.data.aboveMax) {
        setNotice(`Asked for ${counterRate}%, which is above the ceiling. The agent stayed inside the allowed range.`);
      } else if (res.data.negotiation?.status === 'agreed') {
        setNotice(`Deal agreed at ${res.data.negotiation.finalRate}%. A deliverable is ready for the post link.`);
      } else {
        setNotice(`Agent countered at ${res.data.aiResponse?.proposedRate}% .`);
      }
      setCounterMessage('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not send the reply');
    } finally {
      setBusy(false);
    }
  }

  async function decide(negotiationId: string, decision: 'offer_ceiling' | 'decline') {
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/negotiations/${negotiationId}/decide`, { decision });
      setNotice(res.data.message);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save that decision');
    } finally {
      setBusy(false);
    }
  }

  async function acceptOffer(negotiationId: string) {
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/negotiations/${negotiationId}/accept`);
      setNotice(`Accepted ${res.data.negotiation?.finalRate}%. Paste the live link when the post is up.`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not accept');
    } finally {
      setBusy(false);
    }
  }

  async function pasteReply() {
    if (!selectedId || !brand) return;
    const message = pastedReply.trim();
    if (!message) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/agent/reply', { brandId: brand._id, creatorId: selectedId, message });
      setNotice(res.data.answer);
      setPastedReply('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not answer that reply');
    } finally {
      setBusy(false);
    }
  }

  async function markLive(deliverableId: string) {
    const linkUrl = (linkDrafts[deliverableId] || '').trim();
    if (!linkUrl) {
      setError('Paste the post URL first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.patch(`/deliverables/${deliverableId}`, { linkUrl, status: 'live' });
      setNotice('Link saved. This deliverable is live.');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save the link');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading pipeline...</div>;
  if (!campaign) return <div className="alert alert-error">{error || 'Campaign not found'}</div>;

  const brand = typeof campaign.brandId === 'object' ? campaign.brandId : null;
  const selected = campaign.creators.find((c) => creatorIdOf(c.creatorId) === selectedId);
  const selectedCreator = creatorOf(selected?.creatorId);
  const selectedNegotiation = selectedId ? negotiationFor(selectedId) : undefined;
  const bandLeft = campaign.commissionMin;
  const bandWidth = Math.max(0, campaign.commissionMax - campaign.commissionMin);

  return (
    <div>
      <div className="page-header">
        <Link href="/campaigns" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← Campaigns</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{campaign.name}</h1>
        <p className="page-subtitle">
          {brand?.name ? `${brand.name} · ` : ''}{campaign.goal} · ${campaign.budget.toLocaleString()} budget · commission {campaign.commissionMin}–{campaign.commissionMax}%
        </p>
        <Link href={`/campaigns/${campaignId}/report`} className="btn btn-outline btn-sm">Campaign report</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {campaign.creators.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Pipeline is empty</div>
          <p>Approve a creator on this brand. They are added here as Discovered.</p>
          {brand && <Link href={`/discovery/${brand._id}`} className="btn btn-primary" style={{ marginTop: 16 }}>Discover creators</Link>}
        </div>
      ) : (
        <div className="board">
          {STAGES.map((stage) => {
            const cards = campaign.creators.filter((c) => c.stage === stage.id);
            return (
              <div key={stage.id} className="board-col">
                <div className="board-col-title">
                  {stage.label}
                  <span className="board-count">{cards.length}</span>
                </div>
                {cards.map((entry) => {
                  const creator = creatorOf(entry.creatorId);
                  const id = creatorIdOf(entry.creatorId);
                  return (
                    <div key={id} className={`pipeline-card ${selectedId === id ? 'selected' : ''}`}>
                      <button onClick={() => setSelectedId(id)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{creator?.channelTitle || 'Creator'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(creator?.platform || 'youtube').toUpperCase()}
                          {creator?.fitScore !== undefined ? ` · fit ${creator.fitScore}` : ''}
                          {entry.commissionRate !== undefined ? ` · ${entry.commissionRate}%` : ''}
                        </div>
                      </button>
                      <div className="btn-group" style={{ marginTop: 10 }}>
                        {stage.id === 'contacted' && (
                          <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => moveStage(id, 'responded')}>They replied</button>
                        )}
                        {(stage.id === 'contacted' || stage.id === 'responded' || stage.id === 'discovered') && (
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => startNegotiation(id)}>Negotiate</button>
                        )}
                        {stage.id === 'negotiating' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setSelectedId(id)}>Open thread</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {selected && selectedCreator && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem' }}>{selectedCreator.channelTitle}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                Stage: {selected.stage} · allowed commission {campaign.commissionMin}% to {campaign.commissionMax}%
              </p>
            </div>
            {brand && <Link href={`/outreach/${brand._id}`} className="btn btn-outline btn-sm">Outreach emails</Link>}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span>Offer {selectedNegotiation ? `${selectedNegotiation.currentOffer}%` : 'not started'}</span>
              <span>100%</span>
            </div>
            <div className="guardrail">
              <div className="guardrail-band" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
              {selectedNegotiation && (
                <div className="guardrail-mark" style={{ left: `${Math.min(100, Math.max(0, selectedNegotiation.currentOffer))}%` }} />
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              The purple band is the only range the agent may offer. A reply above {campaign.commissionMax}% is refused.
              {selectedNegotiation ? ` Round ${selectedNegotiation.currentRound} of ${selectedNegotiation.maxRounds}.` : ''}
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="form-label">Paste their reply</label>
            <textarea className="form-textarea" rows={3} value={pastedReply} onChange={(e) => setPastedReply(e.target.value)} placeholder="Can you do 25%? or Send me the product first." />
            <button className="btn btn-primary btn-sm" type="button" disabled={busy} onClick={pasteReply}>Let the agent answer</button>
          </div>

          {!selectedNegotiation && (
            <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
              Start negotiation to send the opening offer. Sending the outreach email moves this creator to Contacted.
            </p>
          )}

          {selectedNegotiation && (
            <>
              <div className="thread">
                {selectedNegotiation.messages.map((msg, index) => (
                  <div key={`${msg.timestamp}-${index}`} className={`bubble ${msg.role === 'ai_agent' ? 'bubble-agent' : msg.role === 'creator' ? 'bubble-creator' : ''}`}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      {msg.role === 'ai_agent' ? 'Agent' : msg.role === 'creator' ? 'Creator' : 'Brand'}
                      {msg.proposedRate !== undefined ? ` · ${msg.proposedRate}%` : ''}
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.message}</div>
                  </div>
                ))}
              </div>

              {selectedNegotiation.status === 'in_progress' && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>Simulate a creator reply</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">They ask for (%)</label>
                      <input type="number" min={0} max={100} className="form-input" value={counterRate} onChange={(e) => setCounterRate(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <input className="form-input" value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} placeholder="I usually charge 25% for this niche" />
                    </div>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-primary" disabled={busy} onClick={() => sendCounter(selectedNegotiation._id)}>Send reply</button>
                    <button className="btn btn-success" disabled={busy} onClick={() => acceptOffer(selectedNegotiation._id)}>Accept current offer ({selectedNegotiation.currentOffer}%)</button>
                  </div>
                </div>
              )}

              {selectedNegotiation.status === 'needs_human' && (
                <div>
                  <div className="alert alert-error">
                    This creator asked for more than {selectedNegotiation.commissionMax}%. The agent stopped. You can offer the ceiling or decline. The agent will not go above {selectedNegotiation.commissionMax}%.
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-primary" disabled={busy} onClick={() => decide(selectedNegotiation._id, 'offer_ceiling')}>
                      Offer the ceiling ({selectedNegotiation.commissionMax}%)
                    </button>
                    <button className="btn btn-danger" disabled={busy} onClick={() => decide(selectedNegotiation._id, 'decline')}>
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {selectedNegotiation.status === 'agreed' && (
                <div className="alert alert-success">Agreed at {selectedNegotiation.finalRate ?? selectedNegotiation.currentOffer}%.</div>
              )}
              {selectedNegotiation.status === 'rejected' && (
                <div className="alert alert-error">This negotiation was closed.</div>
              )}
            </>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 6 }}>Deliverables</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          A card is created when a rate is agreed. Paste the live post URL to mark it live. The tracking link stays with the record.
        </p>
        {deliverables.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No deliverables yet. Agree a commission first.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deliverables.map((item) => {
              const creator = creatorOf(item.creatorId);
              const due = new Date(item.dueDate).toLocaleDateString();
              return (
                <div key={item._id} className="pipeline-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{item.title}</strong>
                    <span className={`badge ${item.status === 'live' ? 'badge-success' : 'badge-warning'}`}>{item.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 10px' }}>
                    {creator?.channelTitle || 'Creator'} · {item.type.replace(/_/g, ' ')} · due {due}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                    Tracking: <span style={{ color: 'var(--text-secondary)' }}>{item.trackingUrl}</span>
                  </div>
                  {item.status === 'live' ? (
                    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{item.linkUrl}</a>
                  ) : (
                    <div className="btn-group">
                      <input
                        className="form-input"
                        style={{ maxWidth: 420 }}
                        placeholder="https://..."
                        value={linkDrafts[item._id] ?? item.linkUrl}
                        onChange={(e) => setLinkDrafts({ ...linkDrafts, [item._id]: e.target.value })}
                      />
                      <button className="btn btn-success btn-sm" disabled={busy} onClick={() => markLive(item._id)}>Mark live</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Loading pipeline...</div>}>
      <CampaignContent />
    </Suspense>
  );
}

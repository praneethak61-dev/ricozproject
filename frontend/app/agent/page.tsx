'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { CreatorInsights, RecentVideo, ScoreBreakdown } from '@/components/CreatorInsights';

interface Brand {
  _id: string;
  name: string;
  niche: string;
  productPrice?: number;
}

interface BriefRecord {
  _id: string;
  prompt: string;
  creatorCount: number;
  sample: boolean;
  createdAt: string;
  niche: string;
  minFollowers: number;
  maxFollowers: number;
  commissionMin: number;
  commissionMax: number;
  campaignId?: string;
}

interface Guardrails {
  niche: string;
  minFollowers: number;
  maxFollowers: number;
  commissionMin: number;
  commissionMax: number;
  campaignId: string;
}

interface Creator {
  _id: string;
  channelTitle: string;
  channelId: string;
  description: string;
  subscriberCount: number;
  thumbnailUrl: string;
  fitScore: number;
  fitReason: string;
  contactEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  sample?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  recentVideos?: RecentVideo[];
}

interface ReplyResult {
  answer: string;
  needsHuman?: boolean;
}

interface OutreachEntry {
  _id: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  creatorId: { channelTitle?: string } | string;
}

const EXAMPLE =
  'Find dog-training YouTubers with 10K to 100K followers, and offer 10% to 15% commission.';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  return <div className={`score-ring ${cls}`}>{score}</div>;
}

export default function AgentPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [prompt, setPrompt] = useState(EXAMPLE);
  const [guardrails, setGuardrails] = useState<Guardrails | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState(25);
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyNotes, setReplyNotes] = useState<Record<string, ReplyResult>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const searchGen = useRef(0);

  useEffect(() => {
    api.get('/brands')
      .then((res) => {
        const list: Brand[] = res.data.brands || [];
        setBrands(list);
        if (list[0]) {
          setBrandId(list[0]._id);
          setProductPrice(list[0].productPrice || 25);
        }
      })
      .catch(() => setError('Could not load brands.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!brandId) return;
    const gen = searchGen.current;
    let cancelled = false;
    api.get(`/discovery/${brandId}/creators`, { params: { platform: 'youtube' } })
      .then((res) => {
        if (!cancelled && searchGen.current === gen) setCreators(res.data.creators || []);
      })
      .catch(() => {});
    api.get('/agent/briefs', { params: { brandId } })
      .then((res) => {
        if (!cancelled) setBriefs(res.data.briefs || []);
      })
      .catch(() => {});
    const brand = brands.find((item) => item._id === brandId);
    if (brand) setProductPrice(brand.productPrice || 25);
    return () => { cancelled = true; };
  }, [brandId, brands]);

  const approved = creators.filter((c) => c.status === 'approved');
  const pending = creators.filter((c) => c.status === 'pending');

  async function runBrief(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) return;
    searchGen.current += 1;
    setRunning(true);
    setError('');
    setNotice('');
    setOutreach([]);
    try {
      const briefRes = await api.post('/agent/brief', { brandId, prompt });
      const parsed = briefRes.data.parsed;
      const search = briefRes.data.search;
      setGuardrails({
        niche: parsed.niche,
        minFollowers: parsed.minFollowers,
        maxFollowers: parsed.maxFollowers,
        commissionMin: parsed.commissionMin,
        commissionMax: parsed.commissionMax,
        campaignId: briefRes.data.campaign._id,
      });

      const searchRes = await api.post(`/discovery/${brandId}/search`, {
        query: search.query,
        platforms: ['youtube'],
        maxResults: 50,
        minAudienceSize: search.minAudienceSize,
        maxAudienceSize: search.maxAudienceSize,
        prompt,
      });
      const found: Creator[] = searchRes.data.creators || [];
      const ranked = [...found].sort((a, b) => b.fitScore - a.fitScore);
      setCreators(ranked);
      if (searchRes.data.sampleData) {
        setNotice(`YouTube was unavailable. These ${ranked.length} channels are sample data, not live YouTube.`);
      } else if (ranked.length === 0) {
        setNotice('YouTube returned no channels inside that follower range. Try a broader niche.');
      } else {
        setNotice(`Ranked ${ranked.length} YouTube creators by fit. Approve the ones the agent should email.`);
      }
      const history = await api.get('/agent/briefs', { params: { brandId } });
      setBriefs(history.data.briefs || []);
      if (searchRes.data.youtubeWarning) {
        setError(searchRes.data.youtubeWarning);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'The agent could not run that instruction.');
    } finally {
      setRunning(false);
    }
  }

  async function setStatus(creatorId: string, status: 'approved' | 'rejected') {
    setError('');
    try {
      await api.patch(`/discovery/creators/${creatorId}/status`, { status });
      setCreators((prev) => prev.map((c) => (c._id === creatorId ? { ...c, status } : c)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update that creator.');
    }
  }

  async function approveTop() {
    const next = pending.slice(0, 20);
    if (next.length === 0) return;
    setError('');
    setNotice('');
    try {
      await Promise.all(next.map((c) => api.patch(`/discovery/creators/${c._id}/status`, { status: 'approved' })));
      const ids = new Set(next.map((c) => c._id));
      setCreators((prev) => prev.map((c) => (ids.has(c._id) ? { ...c, status: 'approved' } : c)));
      setNotice(`Approved ${next.length}. The agent will email only these.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not approve that batch.');
    }
  }

  async function draftEmails() {
    if (!brandId || approved.length === 0) return;
    setEmailing(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post(`/outreach/${brandId}/generate`);
      const listRes = await api.get(`/outreach/${brandId}`);
      setOutreach(listRes.data.outreach || []);
      setNotice(res.data.message || 'Emails are ready to send.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not write the emails.');
    } finally {
      setEmailing(false);
    }
  }

  async function sendOne(id: string) {
    setSendingId(id);
    setError('');
    try {
      await api.post(`/outreach/${id}/send`);
      setOutreach((prev) => prev.map((o) => (o._id === id ? { ...o, status: 'sent' } : o)));
      setNotice('Sent to the test inbox. Live creator inboxes stay off until sending is switched on.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not send that email.');
    } finally {
      setSendingId(null);
    }
  }

  async function sendAllDrafts() {
    const drafts = outreach.filter((o) => o.status === 'draft');
    for (const draft of drafts) {
      await sendOne(draft._id);
    }
  }

  async function savePrice() {
    if (!brandId) return;
    try {
      await api.put(`/brands/${brandId}`, { productPrice: Number(productPrice) || 25 });
    } catch {
      setError('Could not save the product price.');
    }
  }

  async function reopenBrief(id: string) {
    setError('');
    setNotice('');
    try {
      const res = await api.get(`/agent/briefs/${id}`);
      const brief = res.data.brief as BriefRecord;
      setPrompt(brief.prompt);
      setGuardrails({
        niche: brief.niche,
        minFollowers: brief.minFollowers,
        maxFollowers: brief.maxFollowers,
        commissionMin: brief.commissionMin,
        commissionMax: brief.commissionMax,
        campaignId: brief.campaignId || '',
      });
      setCreators(res.data.creators || []);
      setNotice(brief.sample
        ? 'Opened a saved sample list. These channels are not live YouTube.'
        : `Opened a saved search with ${res.data.creators?.length || 0} creators.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not open that search.');
    }
  }

  async function answerReply(creatorId: string) {
    const message = (replies[creatorId] || '').trim();
    if (!message) return;
    setReplyingId(creatorId);
    setError('');
    try {
      const res = await api.post('/agent/reply', { brandId, creatorId, message });
      setReplyNotes((prev) => ({ ...prev, [creatorId]: { answer: res.data.answer, needsHuman: res.data.needsHuman } }));
      setNotice(res.data.answer);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not answer that reply.');
    } finally {
      setReplyingId(null);
    }
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ask the agent</h1>
        <p className="page-subtitle">
          Tell Ricoz who to find and the commission you will pay. It searches YouTube, ranks the list, and emails only the creators you approve.
          Negotiation and post tracking come next.
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <div className="empty-state-title">Add a brand first</div>
          <p>The agent works for one store at a time.</p>
          <Link href="/brands" className="btn btn-primary" style={{ marginTop: 16 }}>Create a brand</Link>
        </div>
      ) : (
        <form onSubmit={runBrief} className="card" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <select className="form-select" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Product price used for the sales guess ($)</label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={productPrice}
              onChange={(e) => setProductPrice(Number(e.target.value))}
              onBlur={savePrice}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Instruction</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={running}>
            {running ? <><span className="spinner" /> Searching YouTube...</> : 'Find and rank creators'}
          </button>
        </form>
      )}

      {briefs.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 10 }}>Saved searches</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {briefs.map((brief) => (
              <button key={brief._id} type="button" className="history-row" onClick={() => reopenBrief(brief._id)}>
                <span>{brief.prompt}</span>
                <span>{brief.creatorCount} creators{brief.sample ? ' · sample' : ''} · {new Date(brief.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {guardrails && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Guardrails for this search</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            YouTube only · {guardrails.niche} · {formatNum(guardrails.minFollowers)} to {formatNum(guardrails.maxFollowers)} followers ·
            first offer {guardrails.commissionMin}%, never above {guardrails.commissionMax}%.
          </p>
          <div className="btn-group" style={{ marginTop: 12 }}>
            {guardrails.campaignId && (
              <Link href={`/campaigns/${guardrails.campaignId}`} className="btn btn-outline btn-sm">Open campaign</Link>
            )}
            {guardrails.campaignId && (
              <Link href={`/campaigns/${guardrails.campaignId}/report`} className="btn btn-outline btn-sm">Campaign report</Link>
            )}
          </div>
        </div>
      )}

      {creators.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem' }}>Ranked list · {creators.length} creators · {approved.length} approved</h2>
            <div className="btn-group">
              <button className="btn btn-outline btn-sm" type="button" onClick={approveTop} disabled={pending.length === 0}>
                Approve top {Math.min(20, pending.length) || 20}
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={draftEmails} disabled={emailing || approved.length === 0}>
                {emailing ? <><span className="spinner" /> Writing emails...</> : `Email ${approved.length || ''} approved`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {creators.map((creator, index) => (
              <div key={creator._id} className="card">
                <div className="creator-card">
                  <div style={{ fontWeight: 800, width: 28, color: 'var(--text-muted)', paddingTop: 16 }}>#{index + 1}</div>
                  <img src={creator.thumbnailUrl || '/placeholder.png'} alt="" className="creator-thumb" />
                  <div className="creator-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div className="creator-name">
                          <a href={`https://youtube.com/channel/${creator.channelId}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                            {creator.channelTitle}
                          </a>
                          <span className={`badge ${creator.status === 'approved' ? 'badge-success' : creator.status === 'rejected' ? 'badge-danger' : 'badge-neutral'}`} style={{ marginLeft: 8 }}>
                            {creator.status}
                          </span>
                        </div>
                        <div className="creator-stats">
                          <span>{formatNum(creator.subscriberCount)} subscribers</span>
                          <span>YouTube</span>
                          {creator.contactEmail ? <span>{creator.contactEmail}</span> : <span>No public email</span>}
                        </div>
                      </div>
                      <ScoreBadge score={creator.fitScore} />
                    </div>
                    <p className="creator-reason">{creator.fitReason}</p>
                    <CreatorInsights
                      breakdown={creator.scoreBreakdown}
                      videos={creator.recentVideos}
                      subscribers={creator.subscriberCount}
                      commissionPercent={guardrails?.commissionMin || 20}
                      productPrice={productPrice || 25}
                      sample={creator.sample}
                    />
                    <div className="btn-group" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" type="button" onClick={() => setStatus(creator._id, 'approved')} disabled={creator.status === 'approved'}>
                        Approve
                      </button>
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => setStatus(creator._id, 'rejected')} disabled={creator.status === 'rejected'}>
                        Skip
                      </button>
                    </div>
                    {creator.status === 'approved' && (
                      <div style={{ marginTop: 12 }}>
                        <label className="form-label">Paste their reply</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="Can you do 25%? or Can you send the product first?"
                          value={replies[creator._id] || ''}
                          onChange={(e) => setReplies({ ...replies, [creator._id]: e.target.value })}
                        />
                        <button className="btn btn-outline btn-sm" type="button" disabled={replyingId === creator._id} onClick={() => answerReply(creator._id)}>
                          {replyingId === creator._id ? 'Reading reply...' : 'Let the agent answer'}
                        </button>
                        {replyNotes[creator._id] && (
                          <p className="creator-reason">{replyNotes[creator._id].answer}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outreach.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.05rem' }}>Emails</h2>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={sendAllDrafts}
              disabled={!outreach.some((o) => o.status === 'draft') || sendingId !== null}
            >
              Send all drafts
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {outreach.map((entry) => {
              const name = typeof entry.creatorId === 'object' ? entry.creatorId.channelTitle : 'Creator';
              const open = openEmail === entry._id;
              return (
                <div key={entry._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>{entry.subject}</div>
                    </div>
                    <span className={`badge ${entry.status === 'sent' ? 'badge-success' : entry.status === 'failed' ? 'badge-danger' : 'badge-neutral'}`}>
                      {entry.status}
                    </span>
                  </div>
                  {open && (
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {entry.body}
                    </pre>
                  )}
                  <div className="btn-group" style={{ marginTop: 12 }}>
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => setOpenEmail(open ? null : entry._id)}>
                      {open ? 'Hide' : 'Read'}
                    </button>
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => sendOne(entry._id)} disabled={entry.status === 'sent' || sendingId === entry._id}>
                      {sendingId === entry._id ? 'Sending...' : 'Send test email'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

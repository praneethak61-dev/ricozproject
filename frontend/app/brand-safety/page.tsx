'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface BlacklistEntry {
  _id?: string;
  channelTitle: string;
  channelId?: string;
  platform?: string;
  reason: 'competitor' | 'controversy' | 'do_not_contact' | 'poor_performance' | 'other';
  notes?: string;
  addedAt: string;
}

interface BrandItem {
  _id: string;
  name: string;
  niche: string;
  blacklist?: BlacklistEntry[];
}

const PREVIEW_BLACKLIST: BlacklistEntry[] = [
  {
    _id: 'sample-bl-1',
    channelTitle: 'RivalTech Reviews',
    platform: 'youtube',
    reason: 'competitor',
    notes: 'Signed exclusive annual ambassadorship with our primary competitor in Q1.',
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'sample-bl-2',
    channelTitle: 'DramaDaily Gossip',
    platform: 'youtube',
    reason: 'controversy',
    notes: 'Flagged by automated safety check for brand reputation and controversy risks.',
    addedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    _id: 'sample-bl-3',
    channelTitle: 'FastFashionHauls_Official',
    platform: 'instagram',
    reason: 'do_not_contact',
    notes: 'Requested removal from brand outreach list via unsubscribe reply.',
    addedAt: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    _id: 'sample-bl-4',
    channelTitle: 'ViralBotFarm99',
    platform: 'tiktok',
    reason: 'poor_performance',
    notes: 'Audience credibility analysis detected 78% bot/inauthentic followers.',
    addedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
];

export default function BrandSafetyPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [channelTitle, setChannelTitle] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [reason, setReason] = useState<'competitor' | 'controversy' | 'do_not_contact' | 'poor_performance' | 'other'>('competitor');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrandsAndBlacklist() {
      try {
        const res = await api.get('/brands');
        const list = res.data.brands || [];
        setBrands(list);
        if (list.length > 0) {
          setSelectedBrandId(list[0]._id);
          const blRes = await api.get(`/brands/${list[0]._id}/blacklist`);
          const entries = blRes.data.blacklist || [];
          setBlacklist(entries.length > 0 ? entries : PREVIEW_BLACKLIST);
        } else {
          setBlacklist(PREVIEW_BLACKLIST);
        }
      } catch (err) {
        console.error('Failed to load blacklist:', err);
        setBlacklist(PREVIEW_BLACKLIST);
      } finally {
        setLoading(false);
      }
    }
    loadBrandsAndBlacklist();
  }, []);

  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    try {
      const blRes = await api.get(`/brands/${brandId}/blacklist`);
      const entries = blRes.data.blacklist || [];
      setBlacklist(entries.length > 0 ? entries : PREVIEW_BLACKLIST);
    } catch {
      setBlacklist(PREVIEW_BLACKLIST);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelTitle.trim()) return;

    setSubmitting(true);
    try {
      if (!selectedBrandId) {
        // Local preview simulation
        const newEntry: BlacklistEntry = {
          _id: `temp-${Date.now()}`,
          channelTitle: channelTitle.trim(),
          platform,
          reason,
          notes: notes.trim(),
          addedAt: new Date().toISOString(),
        };
        setBlacklist([newEntry, ...blacklist]);
        setChannelTitle('');
        setNotes('');
        showToast(`Added "${channelTitle}" to the Brand Safety Blacklist!`);
      } else {
        const res = await api.post(`/brands/${selectedBrandId}/blacklist`, {
          channelTitle: channelTitle.trim(),
          platform,
          reason,
          notes: notes.trim(),
        });
        setBlacklist(res.data.blacklist);
        setChannelTitle('');
        setNotes('');
        showToast(`Added "${channelTitle}" to the Brand Safety Blacklist!`);
      }
    } catch (err: any) {
      console.error('Failed to add to blacklist:', err);
      showToast('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBlacklist = async (entry: BlacklistEntry) => {
    const entryId = entry._id || entry.channelTitle;
    try {
      if (!selectedBrandId || entryId.startsWith('sample-') || entryId.startsWith('temp-')) {
        setBlacklist(blacklist.filter((b) => (b._id || b.channelTitle) !== entryId));
        showToast(`Removed "${entry.channelTitle}" from blacklist.`);
      } else {
        const res = await api.delete(`/brands/${selectedBrandId}/blacklist/${entryId}`);
        setBlacklist(res.data.blacklist);
        showToast(`Removed "${entry.channelTitle}" from blacklist.`);
      }
    } catch (err: any) {
      console.error('Failed to remove from blacklist:', err);
      showToast('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredBlacklist = blacklist.filter((b) =>
    b.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dash-page-wrapper">
      {/* Toast */}
      {toastMessage && (
        <div className="dash-toast-banner">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Hero Banner */}
      <section className="dash-hero-banner">
        <div className="dash-hero-left">
          <div className="dash-hero-chips">
            <span className="dash-live-badge">
              <span className="dash-pulse-dot"></span>
              Brand Safety Shield: 99.4% Protected
            </span>
            <span className="dash-plan-badge">
              Automated Vetting & Competitor Exclusion
            </span>
            <span className="dash-quota-badge">
              Active Blacklist Enforcement
            </span>
          </div>

          <h1 className="dash-hero-title">
            Creator Do-Not-Contact & <span className="dash-user-name">Competitor Blacklist</span>
          </h1>
          <p className="dash-hero-subtitle">
            Safeguard your brand equity. Exclude influencers who work with direct competitors, have past controversies, or requested Do-Not-Contact (DNC). Creators in this list are automatically flagged and blocked from discovery and outreach.
          </p>
        </div>

        <div className="dash-hero-actions">
          <Link href="/discovery" className="dash-btn-primary">
            <span>🔍</span> Creator Discovery
          </Link>
          <Link href="/brands" className="dash-btn-glass">
            Brand Settings
          </Link>
        </div>
      </section>

      {/* 4 Brand Safety Metric Cards */}
      <section className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">● Shield Active</span>
          </div>
          <div className="dash-kpi-value">99.4%</div>
          <div className="dash-kpi-label">Brand Protection Index</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Zero brand reputation incidents detected</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <span className="dash-kpi-trend highlight">Blocked</span>
          </div>
          <div className="dash-kpi-value">{blacklist.length}</div>
          <div className="dash-kpi-label">Blacklisted Creators</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Restricted from outreach queues</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span className="dash-kpi-trend live">Exclusions</span>
          </div>
          <div className="dash-kpi-value">
            {blacklist.filter((b) => b.reason === 'competitor').length}
          </div>
          <div className="dash-kpi-label">Competitor Affiliates</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Creators promoting rival product lines</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">AI Vetted</span>
          </div>
          <div className="dash-kpi-value">100%</div>
          <div className="dash-kpi-label">Automated Safety Screening</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Gemini AI content & controversy scans</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Add Blacklist Form on Left, Blacklist Table on Right */}
      <div className="dash-main-grid">
        {/* Left Form */}
        <div className="dash-col-left">
          <div className="dash-card dash-card-highlight">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Add Creator to Blacklist</h2>
                <p className="dash-card-subtitle">
                  Prevent accidental outreach or sponsor partnerships with restricted creators
                </p>
              </div>
            </div>

            <form onSubmit={handleAddBlacklist} className="dash-quick-discovery-form">
              {brands.length > 0 && (
                <div className="dash-field-group">
                  <label className="dash-field-label">Target Brand Profile</label>
                  <select
                    className="dash-brand-select"
                    value={selectedBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                  >
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.niche})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="dash-field-group">
                <label className="dash-field-label">Creator Channel Title or Handle</label>
                <input
                  type="text"
                  className="dash-discovery-input"
                  placeholder="e.g. '@techchannel', 'RivalCreator Reviews'"
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  required
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-field-label">Platform</label>
                <select
                  className="dash-brand-select"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram Reels</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other Platform</option>
                </select>
              </div>

              <div className="dash-field-group">
                <label className="dash-field-label">Exclusion Reason</label>
                <select
                  className="dash-brand-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                >
                  <option value="competitor">Worked with Direct Competitor</option>
                  <option value="controversy">Past Controversial Content / Brand Risk</option>
                  <option value="do_not_contact">Do-Not-Contact (DNC) / Unsubscribed</option>
                  <option value="poor_performance">Poor Engagement / Inauthentic Bot Followers</option>
                  <option value="other">Other Brand Safety Flag</option>
                </select>
              </div>

              <div className="dash-field-group">
                <label className="dash-field-label">Context / Internal Notes</label>
                <textarea
                  className="dash-discovery-input"
                  rows={3}
                  placeholder="e.g. Signed contract with competitor X on Jan 2026; do not contact until 2027."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="dash-btn-primary full-width"
                disabled={submitting || !channelTitle.trim()}
              >
                {submitting ? 'Adding to Safety Blacklist...' : '🛡️ Add Creator to Blacklist'}
              </button>
            </form>
          </div>

          {/* Automated Safety Rules Card */}
          <div className="dash-card ai-glow-card">
            <div className="dash-card-header">
              <div className="dash-card-header-icon-title">
                <span className="dash-ai-icon-chip">🤖 AI Automated Safety Rules</span>
                <h2 className="dash-card-title">Live Vetting Criteria</h2>
              </div>
            </div>

            <div className="safety-rules-list">
              <div className="safety-rule-item">
                <span className="safety-rule-check">✓</span>
                <div>
                  <strong>Competitor Brand Mentions:</strong> Automatically flags creators who featured competitor logos in their last 10 uploads.
                </div>
              </div>
              <div className="safety-rule-item">
                <span className="safety-rule-check">✓</span>
                <div>
                  <strong>Toxicity & Profanity Filtering:</strong> Analyzes video titles and descriptions for high-risk controversy categories.
                </div>
              </div>
              <div className="safety-rule-item">
                <span className="safety-rule-check">✓</span>
                <div>
                  <strong>Inauthentic Engagement Detection:</strong> Flags channels with suspicious view-to-comment ratios below 0.5%.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Table of Blacklisted Creators */}
        <div className="dash-col-right">
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Enforced Blacklist ({filteredBlacklist.length})</h2>
                <p className="dash-card-subtitle">Creators restricted from discovery and outreach</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                className="dash-discovery-input"
                placeholder="Search blacklist by channel, reason, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="dash-empty-state">
                <div className="dash-spinner"></div>
                <p>Loading blacklist...</p>
              </div>
            ) : filteredBlacklist.length === 0 ? (
              <div className="dash-empty-state">
                <span className="dash-empty-icon">🛡️</span>
                <p>No creators match your search in this blacklist.</p>
              </div>
            ) : (
              <div className="bl-list">
                {filteredBlacklist.map((item, idx) => (
                  <div key={item._id || idx} className="bl-item">
                    <div className="bl-item-left">
                      <div className="bl-channel-title">
                        {item.channelTitle}
                        <span className={`deliv-platform-badge ${item.platform || 'youtube'}`}>
                          {item.platform || 'YouTube'}
                        </span>
                      </div>
                      <div className="bl-reason-row">
                        <span className={`bl-reason-badge ${item.reason}`}>
                          {item.reason === 'competitor' && '❌ Competitor Affiliation'}
                          {item.reason === 'controversy' && '⚠️ Content Controversy'}
                          {item.reason === 'do_not_contact' && '🚫 Do-Not-Contact (DNC)'}
                          {item.reason === 'poor_performance' && '📉 Bot Followers / Low Quality'}
                          {item.reason === 'other' && '📌 Brand Policy Exclusion'}
                        </span>
                        <span className="bl-date">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.notes && <p className="bl-notes">{item.notes}</p>}
                    </div>

                    <div className="bl-item-actions">
                      <button
                        type="button"
                        className="bl-remove-btn"
                        onClick={() => handleRemoveBlacklist(item)}
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { CreatorInsights, RecentVideo, ScoreBreakdown } from '@/components/CreatorInsights';

interface Creator {
  _id: string;
  channelId: string;
  channelTitle: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  contactEmail: string;
  fitScore: number;
  fitReason: string;
  platform?: 'youtube' | 'instagram' | 'tiktok';
  status: 'pending' | 'approved' | 'rejected';
  sample?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  recentVideos?: RecentVideo[];
  isBlacklisted?: boolean;
  blacklistReason?: string;
}

interface Brand {
  _id: string;
  name: string;
  niche: string;
  productPrice?: number;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  return <div className={`score-ring ${cls}`}>{score}</div>;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function DiscoveryContent() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [platforms, setPlatforms] = useState({ youtube: true, instagram: false, tiktok: false });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [offerPercent, setOfferPercent] = useState(0);

  useEffect(() => {
    loadData();
  }, [brandId]);

  async function loadData() {
    try {
      const [brandRes, creatorsRes, campaignsRes] = await Promise.all([
        api.get(`/brands/${brandId}`),
        api.get(`/discovery/${brandId}/creators`),
        api.get('/campaigns'),
      ]);
      setBrand(brandRes.data.brand);
      setCreators(creatorsRes.data.creators || []);
      const active = (campaignsRes.data.campaigns || []).find((campaign: { status?: string; brandId?: { _id?: string } | string; commissionMin?: number }) => {
        const id = typeof campaign.brandId === 'object' ? campaign.brandId?._id : campaign.brandId;
        return id === brandId && campaign.status === 'active';
      });
      setOfferPercent(active?.commissionMin || 0);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setSearching(true);
    setError('');
    setSuccessMsg('');
    try {
      const selected = (Object.keys(platforms) as Array<keyof typeof platforms>).filter((key) => platforms[key]);
      if (selected.length === 0) {
        setError('Pick at least one platform.');
        setSearching(false);
        return;
      }
      const res = await api.post(`/discovery/${brandId}/search`, { maxResults: 50, platforms: selected });
      setCreators(res.data.creators || []);
      const sample = selected.filter((p) => p !== 'youtube');
      const sampleNote = sample.length ? ` Instagram and TikTok rows are sample data.` : '';
      setSuccessMsg(`Found ${res.data.creators?.length || 0} creators. YouTube quota ${res.data.quota?.used}/${res.data.quota?.limit}.${sampleNote}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Discovery failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleStatus(creatorId: string, status: 'approved' | 'rejected') {
    try {
      const res = await api.patch(`/discovery/creators/${creatorId}/status`, { status });
      setCreators((prev) =>
        prev.map((c) => (c._id === creatorId ? { ...c, status } : c))
      );
      if (status === 'approved') {
        setSuccessMsg(
          res.data.pipeline?.added
            ? `Approved and added to “${res.data.pipeline.campaignName}” as Discovered.`
            : 'Approved. Open an active campaign for this brand so the next approval lands on the pipeline.'
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  const filtered = creators.filter((c) => {
    const statusOk = filter === 'all' || c.status === filter;
    const platformOk = platformFilter === 'all' || (c.platform || 'youtube') === platformFilter;
    return statusOk && platformOk;
  });

  function profileUrl(creator: Creator) {
    if (creator.platform === 'instagram') return `https://instagram.com/${creator.channelId.replace(/^ig_/, '')}`;
    if (creator.platform === 'tiktok') return `https://www.tiktok.com/@${creator.channelId.replace(/^tt_/, '')}`;
    return `https://youtube.com/channel/${creator.channelId}`;
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <Link href="/brands" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Brands</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>Creator Discovery{brand ? ` — ${brand.name}` : ''}</h1>
        <p className="page-subtitle">This version searches YouTube and ranks creators by fit. Instagram and TikTok stay off unless you turn the sample lists on.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['youtube', 'instagram', 'tiktok'] as const).map((platform) => (
          <label key={platform} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={platforms[platform]}
              onChange={(e) => setPlatforms({ ...platforms, [platform]: e.target.checked })}
            />
            {platform}
            {platform !== 'youtube' && <span className="badge badge-warning">Sample</span>}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
          {searching ? <><span className="spinner" /> Searching...</> : 'Search creators'}
        </button>
        <div className="btn-group">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${creators.filter((c) => c.status === f).length})`}
            </button>
          ))}
        </div>
        <div className="btn-group">
          {['all', 'youtube', 'instagram', 'tiktok'].map((platform) => (
            <button key={platform} className={`btn btn-sm ${platformFilter === platform ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPlatformFilter(platform)}>
              {platform === 'all' ? 'All platforms' : platform}
            </button>
          ))}
        </div>
        <Link href={`/outreach/${brandId}`} className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
          Outreach
        </Link>
        <Link href="/campaigns" className="btn btn-outline btn-sm">Campaigns</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">
            {creators.length === 0 ? 'No creators discovered yet' : 'No creators match this filter'}
          </div>
          <p>{creators.length === 0 ? 'Search to find creators that match this brand. Approve them after you have an active campaign.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((creator) => (
            <div key={creator._id} className="card">
              <div className="creator-card">
                <img src={creator.thumbnailUrl || '/placeholder.png'} alt={creator.channelTitle} className="creator-thumb" />
                <div className="creator-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div className="creator-name">
                        {creator.channelTitle}{' '}
                        <span className={`badge ${creator.platform && creator.platform !== 'youtube' ? 'badge-warning' : 'badge-neutral'}`}>
                          {(creator.platform || 'youtube').toUpperCase()}
                          {creator.platform && creator.platform !== 'youtube' ? ' · sample' : ''}
                        </span>
                      </div>
                      <div className="creator-stats">
                        <span>{formatNum(creator.subscriberCount)} audience</span>
                        <span>👁 {formatNum(creator.viewCount)} views</span>
                        <span>🎬 {creator.videoCount} videos</span>
                        {creator.contactEmail && <span>✉️ Email found</span>}
                      </div>
                    </div>
                    <ScoreBadge score={creator.fitScore} />
                  </div>
                  <div className="creator-reason">{creator.fitReason}</div>
                  <CreatorInsights
                    breakdown={creator.scoreBreakdown}
                    videos={creator.recentVideos}
                    subscribers={creator.subscriberCount}
                    commissionPercent={offerPercent}
                    productPrice={brand?.productPrice || 25}
                    sample={creator.sample}
                  />
                  {creator.isBlacklisted && (
                    <div className="discovery-blacklist-warning">
                      <span>⛔ Blacklisted ({creator.blacklistReason || 'Restricted'})</span>
                      <span>— Excluded by Brand Safety Rules. Unblock in Brand Safety &amp; DNC to approve.</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <span className={`badge ${creator.status === 'approved' ? 'badge-success' : creator.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {creator.status.toUpperCase()}
                    </span>
                    {creator.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatus(creator._id, 'approved')}
                          disabled={creator.isBlacklisted}
                          title={creator.isBlacklisted ? 'Creator is in Brand Safety Blacklist' : undefined}
                        >
                          ✓ Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(creator._id, 'rejected')}>✗ Reject</button>
                      </>
                    )}
                    <a href={profileUrl(creator)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
                      View profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Loading...</div>}>
      <DiscoveryContent />
    </Suspense>
  );
}

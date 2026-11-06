'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Brand {
  _id: string;
  name: string;
}

interface Campaign {
  _id: string;
  name: string;
  goal: string;
  budget: number;
  commissionMin: number;
  commissionMax: number;
  status: 'active' | 'paused' | 'completed';
  creators: { stage: string }[];
  brandId: { _id: string; name: string; niche?: string } | string;
}

const emptyForm = {
  brandId: '',
  name: '',
  goal: '',
  budget: 2000,
  targetDemographic: '',
  commissionMin: 8,
  commissionMax: 20,
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [campaignRes, brandRes] = await Promise.all([api.get('/campaigns'), api.get('/brands')]);
      setCampaigns(campaignRes.data.campaigns || []);
      setBrands(brandRes.data.brands || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (Number(form.commissionMin) > Number(form.commissionMax)) {
        setError('Commission floor must be lower than the ceiling.');
        setSubmitting(false);
        return;
      }
      await api.post('/campaigns', {
        ...form,
        budget: Number(form.budget),
        commissionMin: Number(form.commissionMin),
        commissionMax: Number(form.commissionMax),
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create the campaign');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading campaigns...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Each campaign holds a budget and the commission range the agent is allowed to offer.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, brandId: brands[0]?._id || '' }); setShowForm(true); }}>+ New campaign</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New campaign</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {brands.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Create a brand first, then come back to open a campaign.</p>
            ) : (
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <select className="form-select" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} required>
                    <option value="">Select a brand</option>
                    {brands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Spring launch" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <input className="form-input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="20 affiliate posts this month" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Who the posts are for</label>
                  <input className="form-input" value={form.targetDemographic} onChange={(e) => setForm({ ...form, targetDemographic: e.target.value })} placeholder="Women 18–34 who buy clean skincare" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Budget ($)</label>
                    <input type="number" min={0} className="form-input" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Commission floor (%)</label>
                    <input type="number" min={0} max={100} className="form-input" value={form.commissionMin} onChange={(e) => setForm({ ...form, commissionMin: Number(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Commission ceiling (%)</label>
                  <input type="number" min={0} max={100} className="form-input" value={form.commissionMax} onChange={(e) => setForm({ ...form, commissionMax: Number(e.target.value) })} required />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>
                  The agent can offer between these two rates and cannot go above the ceiling, even if a creator asks for more.
                </p>
                <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create campaign'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No campaigns yet</div>
          <p>Open a campaign, approve creators, and they land in Discovered.</p>
        </div>
      ) : (
        <div className="card-grid">
          {campaigns.map((campaign) => {
            const brandName = typeof campaign.brandId === 'object' ? campaign.brandId.name : 'Brand';
            return (
              <div key={campaign._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <h3>{campaign.name}</h3>
                  <span className={`badge ${campaign.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{campaign.status}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 12 }}>{campaign.goal}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span className="badge badge-neutral">{brandName}</span>
                  <span className="badge badge-neutral">${campaign.budget.toLocaleString()} budget</span>
                  <span className="badge badge-neutral">{campaign.commissionMin}–{campaign.commissionMax}%</span>
                  <span className="badge badge-neutral">{campaign.creators?.length || 0} creators</span>
                </div>
                <Link href={`/campaigns/${campaign._id}`} className="btn btn-primary btn-sm">Open pipeline</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

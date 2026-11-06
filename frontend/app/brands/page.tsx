'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Brand {
  _id: string;
  name: string;
  niche: string;
  targetAudience: string;
  regions: string[];
  tone: string;
  minAudienceSize: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    targetAudience: '',
    regions: '',
    tone: 'professional',
    minAudienceSize: 1000,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadBrands(); }, []);

  async function loadBrands() {
    try {
      const res = await api.get('/brands');
      setBrands(res.data.brands);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/brands', {
        ...formData,
        regions: formData.regions.split(',').map((r) => r.trim()).filter(Boolean),
        minAudienceSize: Number(formData.minAudienceSize),
      });
      setShowForm(false);
      setFormData({ name: '', niche: '', targetAudience: '', regions: '', tone: 'professional', minAudienceSize: 1000 });
      loadBrands();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create brand');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      loadBrands();
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
  }

  if (loading) return <div className="loading-page"><span className="spinner" /> Loading brands...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Brands</h1>
          <p className="page-subtitle">Manage your brand profiles for influencer discovery</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Brand</button>
      </div>

      {/* Create Brand Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Brand</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Brand Name</label>
                <input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My Brand" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Niche</label>
                  <input className="form-input" value={formData.niche} onChange={(e) => setFormData({ ...formData, niche: e.target.value })} placeholder="e.g. Skincare, Fitness" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select className="form-select" value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })}>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <input className="form-input" value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })} placeholder="e.g. Women 18-35 interested in clean beauty" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Regions (comma-separated)</label>
                  <input className="form-input" value={formData.regions} onChange={(e) => setFormData({ ...formData, regions: e.target.value })} placeholder="e.g. US, UK, India" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min. Audience Size</label>
                  <input type="number" className="form-input" value={formData.minAudienceSize} onChange={(e) => setFormData({ ...formData, minAudienceSize: parseInt(e.target.value) || 0 })} min={0} required />
                </div>
              </div>
              <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {brands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <div className="empty-state-title">No brands yet</div>
          <p>Create your first brand profile to start discovering influencers.</p>
        </div>
      ) : (
        <div className="card-grid">
          {brands.map((brand) => (
            <div key={brand._id} className="card">
              <h3 style={{ marginBottom: 8 }}>{brand.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 12 }}>{brand.niche}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-neutral">{brand.tone}</span>
                {brand.regions.map((r) => (
                  <span key={r} className="badge badge-neutral">{r}</span>
                ))}
                <span className="badge badge-neutral">{brand.minAudienceSize.toLocaleString()}+ subs</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>{brand.targetAudience}</p>
              <div className="btn-group">
                <Link href="/agent" className="btn btn-primary btn-sm">Ask the agent</Link>
                <Link href={`/discovery/${brand._id}`} className="btn btn-outline btn-sm">Discover</Link>
                <Link href={`/outreach/${brand._id}`} className="btn btn-outline btn-sm">✉️ Outreach</Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(brand._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

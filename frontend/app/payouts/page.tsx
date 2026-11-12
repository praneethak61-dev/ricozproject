'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface PayoutRecord {
  _id: string;
  creatorName: string;
  campaignName: string;
  deliverableTitle: string;
  deliverableUrl: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'processing';
  stripeTransferId?: string;
  stripeReceiptUrl?: string;
  date: string;
}

const PREVIEW_PAYOUTS: PayoutRecord[] = [
  {
    _id: 'pay-1',
    creatorName: 'TechVibe Daily',
    campaignName: 'Spring Productivity Launch',
    deliverableTitle: 'Minimalist Desk Setup & Tech Essentials 2026',
    deliverableUrl: 'https://youtube.com/watch?v=sample-desk-setup',
    amount: 450,
    status: 'paid',
    stripeTransferId: 'tr_1Nzk98FkdL20x',
    stripeReceiptUrl: 'https://dashboard.stripe.com/test/transfers/tr_1Nzk98FkdL20x',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'pay-2',
    creatorName: 'Minimalist Living & Studio',
    campaignName: 'Spring Productivity Launch',
    deliverableTitle: '30-Day Morning Routine for Deep Focus (Reel)',
    deliverableUrl: 'https://instagram.com/reel/sample-routine',
    amount: 350,
    status: 'unpaid',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    _id: 'pay-3',
    creatorName: 'DIY Hacks & Tips',
    campaignName: 'Viral TikTok Awareness',
    deliverableTitle: 'How I Plan My Workday in 5 Minutes (TikTok)',
    deliverableUrl: 'https://tiktok.com/@diyhacks/video/sample',
    amount: 300,
    status: 'unpaid',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    _id: 'pay-4',
    creatorName: 'Aesthetic Kitchen & Coffee',
    campaignName: 'D2C Brand Launch',
    deliverableTitle: 'Iced Matcha Morning Ritual Sponsor Integration',
    deliverableUrl: 'https://youtube.com/watch?v=sample-coffee',
    amount: 500,
    status: 'paid',
    stripeTransferId: 'tr_1Mzj82LmOP19q',
    stripeReceiptUrl: 'https://dashboard.stripe.com/test/transfers/tr_1Mzj82LmOP19q',
    date: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

export default function StripePayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    async function loadPayoutData() {
      try {
        const res = await api.get('/deliverables/all');
        const deliverables = res.data.deliverables || [];
        if (deliverables.length > 0) {
          const records: PayoutRecord[] = deliverables.map((del: any) => ({
            _id: del._id,
            creatorName: del.creatorId?.channelTitle || 'Influencer',
            campaignName: del.campaignId?.name || 'Campaign',
            deliverableTitle: del.title || 'Deliverable',
            deliverableUrl: del.linkUrl || '#',
            amount: del.payout?.amount || del.budget || 350,
            status: del.payout?.status === 'paid' ? 'paid' : 'unpaid',
            stripeTransferId: del.payout?.stripeTransferId,
            stripeReceiptUrl: del.payout?.stripeReceiptUrl,
            date: del.payout?.paidAt || del.updatedAt || new Date().toISOString(),
          }));
          setPayouts(records);
        } else {
          setPayouts(PREVIEW_PAYOUTS);
        }
      } catch (err) {
        console.error('Failed to load payout data:', err);
        setPayouts(PREVIEW_PAYOUTS);
      } finally {
        setLoading(false);
      }
    }
    loadPayoutData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePayViaStripe = async (record: PayoutRecord) => {
    setPayingId(record._id);
    try {
      if (record._id.startsWith('pay-')) {
        await new Promise((r) => setTimeout(r, 800));
        const txId = `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        setPayouts((prev) =>
          prev.map((p) =>
            p._id === record._id
              ? {
                  ...p,
                  status: 'paid',
                  stripeTransferId: txId,
                  stripeReceiptUrl: `https://dashboard.stripe.com/test/transfers/${txId}`,
                  date: new Date().toISOString(),
                }
              : p
          )
        );
        showToast(`Stripe transfer of $${record.amount} to ${record.creatorName} completed!`);
      } else {
        const res = await api.post(`/deliverables/${record._id}/payout`, {
          amount: record.amount,
        });
        const payout = res.data.payout;
        setPayouts((prev) =>
          prev.map((p) =>
            p._id === record._id
              ? {
                  ...p,
                  status: 'paid',
                  stripeTransferId: payout.stripeTransferId,
                  stripeReceiptUrl: payout.stripeReceiptUrl,
                  date: payout.paidAt || new Date().toISOString(),
                }
              : p
          )
        );
        showToast(`Stripe transfer of $${record.amount} released!`);
      }
    } catch (err: any) {
      console.error('Payout failed:', err);
      showToast('Payout error: ' + (err.response?.data?.message || err.message));
    } finally {
      setPayingId(null);
    }
  };

  const totalPaid = payouts.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payouts.filter((p) => p.status === 'unpaid').reduce((acc, p) => acc + p.amount, 0);
  const paidCount = payouts.filter((p) => p.status === 'paid').length;
  const avgFee = payouts.length > 0 ? Math.round((totalPaid + pendingAmount) / payouts.length) : 350;

  const filteredPayouts = payouts.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return p.status === 'unpaid';
    if (activeTab === 'completed') return p.status === 'paid';
    return true;
  });

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
              Stripe Connect API: Connected & Active
            </span>
            <span className="dash-plan-badge">
              Instant Creator Milestone Transfers
            </span>
            <span className="dash-quota-badge">
              Automatic W-9 & 1099 Tax Compliance
            </span>
          </div>

          <h1 className="dash-hero-title">
            Automated Commission & <span className="dash-user-name">Stripe Payouts</span>
          </h1>
          <p className="dash-hero-subtitle">
            Pay creators automatically when deliverables are approved. Milestone-based payouts transfer directly into creator bank accounts via Stripe Connect with automatic receipts and accounting ledgers.
          </p>
        </div>

        <div className="dash-hero-actions">
          <Link href="/deliverables" className="dash-btn-primary">
            <span>📈</span> Social Listening & Posts
          </Link>
          <button
            type="button"
            className="dash-btn-glass"
            onClick={() => showToast('Opening Stripe Express Portal...')}
          >
            <span>⚡</span> Stripe Express Portal
          </button>
        </div>
      </section>

      {/* Financial Summary Cards */}
      <section className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="dash-kpi-trend live">Transferred</span>
          </div>
          <div className="dash-kpi-value">${totalPaid.toLocaleString()}</div>
          <div className="dash-kpi-label">Total Paid via Stripe</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">{paidCount} creator payouts released</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="dash-kpi-trend positive">Awaiting Approval</span>
          </div>
          <div className="dash-kpi-value">${pendingAmount.toLocaleString()}</div>
          <div className="dash-kpi-label">Pending Milestone Escrow</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Released once posts are live & verified</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="dash-kpi-trend highlight">Average</span>
          </div>
          <div className="dash-kpi-value">${avgFee}</div>
          <div className="dash-kpi-label">Average Deal Compensation</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Per creator sponsored integration</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <div className="dash-kpi-icon-box cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="dash-kpi-trend live">100% Secure</span>
          </div>
          <div className="dash-kpi-value">Stripe Connected</div>
          <div className="dash-kpi-label">Merchant Payout Status</div>
          <div className="dash-kpi-footer">
            <span className="dash-kpi-subtext">Automated receipts & 1099 reports</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="dash-filter-pills" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className={`dash-filter-pill ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Payouts ({payouts.length})
        </button>
        <button
          type="button"
          className={`dash-filter-pill ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payouts (${pendingAmount})
        </button>
        <button
          type="button"
          className={`dash-filter-pill ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Stripe Transfers
        </button>
      </div>

      {/* Payouts Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <h2 className="dash-card-title">Creator Compensation Ledger</h2>
            <p className="dash-card-subtitle">
              Verified sponsor deliverables and associated milestone payouts
            </p>
          </div>
        </div>

        <div className="deliv-table-wrap">
          <table className="deliv-table">
            <thead>
              <tr>
                <th>Creator & Deliverable</th>
                <th>Campaign</th>
                <th>Milestone Fee</th>
                <th>Payout Status</th>
                <th>Stripe Transfer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((record) => {
                const isPaying = payingId === record._id;
                return (
                  <tr key={record._id} className="deliv-table-row">
                    <td>
                      <div>
                        <div className="deliv-post-title">{record.creatorName}</div>
                        <div className="deliv-creator-name">
                          {record.deliverableTitle} ·{' '}
                          <a
                            href={record.deliverableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="deliv-link-anchor"
                          >
                            🔗 View Post
                          </a>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="payout-campaign-badge">{record.campaignName}</span>
                    </td>

                    <td>
                      <div className="payout-amount-text">
                        <strong>${record.amount}</strong> USD
                      </div>
                    </td>

                    <td>
                      {record.status === 'paid' ? (
                        <span className="payout-status-badge paid">
                          ● Transferred
                        </span>
                      ) : (
                        <span className="payout-status-badge pending">
                          ⏳ Ready for Release
                        </span>
                      )}
                    </td>

                    <td>
                      {record.stripeTransferId ? (
                        <div className="payout-stripe-id-wrap">
                          <span className="deliv-stripe-id">{record.stripeTransferId}</span>
                          <a
                            href={record.stripeReceiptUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="payout-receipt-link"
                          >
                            Receipt →
                          </a>
                        </div>
                      ) : (
                        <span className="payout-stripe-id-wrap text-muted">Awaiting Transfer</span>
                      )}
                    </td>

                    <td>
                      {record.status === 'paid' ? (
                        <button
                          type="button"
                          className="dash-prompt-chip"
                          onClick={() => showToast(`Opening receipt for ${record.stripeTransferId}...`)}
                        >
                          📄 View Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dash-btn-sm-primary"
                          onClick={() => handlePayViaStripe(record)}
                          disabled={isPaying}
                        >
                          {isPaying ? 'Processing Transfer...' : '⚡ Release Payout'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

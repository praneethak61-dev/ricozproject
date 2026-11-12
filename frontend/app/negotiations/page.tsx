'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface NegotiationItem {
  _id: string;
  creatorId: {
    _id: string;
    channelTitle: string;
    platform: string;
    thumbnailUrl?: string;
    subscriberCount?: number;
    fitScore?: number;
  };
  campaignId: {
    _id: string;
    name: string;
  };
  brandId: {
    _id: string;
    name: string;
  };
  currentOffer: number;
  commissionMin: number;
  commissionMax: number;
  currentRound: number;
  maxRounds: number;
  status: string;
  messages: {
    role: string;
    message: string;
    proposedRate?: number;
    timestamp: string;
  }[];
  updatedAt: string;
}

interface AnalysisResult {
  sentiment: 'interested' | 'counter_offer' | 'declined' | 'question';
  extractedRate: number | null;
  extractedFlatFee: number | null;
  confidence: number;
  tone: string;
  recommendedAction: 'accept' | 'counter' | 'decline' | 'answer';
  recommendedRate: number;
  rationale: string;
  draftResponse: string;
}

const SAMPLE_REPLIES = [
  {
    title: 'Counter Offer 22%',
    text: "Thanks for reaching out! Love your brand, but our standard rate for dedicated integrations is 22% commission. Let me know if that works for your team.",
  },
  {
    title: 'High Counter 35% (Above Guardrail)',
    text: "Hey! We typically require at least 35% commission plus product samples for holiday gift guide inclusion.",
  },
  {
    title: 'Flat Fee Request ($500)',
    text: "We received your pitch. We charge a flat fee of $500 per dedicated video review instead of pure affiliate commission.",
  },
  {
    title: 'Enthusiastic Acceptance',
    text: "Hi! This looks like an amazing fit for our audience. 15% commission sounds great, please send over the tracking link and sample info!",
  },
  {
    title: 'Clarifying Questions',
    text: "Hello! Do you ship international samples to Canada? Also, what is the expected turnaround time once products arrive?",
  },
  {
    title: 'Polite Decline',
    text: "Thanks for thinking of us, but our sponsorship calendar is currently full for the upcoming quarter so we will have to pass.",
  },
];

export default function NegotiationCopilotPage() {
  const [negotiations, setNegotiations] = useState<NegotiationItem[]>([]);
  const [selectedNegId, setSelectedNegId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [brandName, setBrandName] = useState('My Brand');
  const [commissionMin, setCommissionMin] = useState(10);
  const [commissionMax, setCommissionMax] = useState(25);
  const [currentOffer, setCurrentOffer] = useState(14);
  const [creatorName, setCreatorName] = useState('TechCreator');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadNegotiations() {
      try {
        const brandsRes = await api.get('/brands');
        const brands = brandsRes.data.brands || [];
        if (brands.length > 0) {
          setBrandName(brands[0].name);
          const negsRes = await api.get(`/negotiations/brand/${brands[0]._id}`);
          const list = negsRes.data.negotiations || [];
          setNegotiations(list);
          if (list.length > 0) {
            setSelectedNegId(list[0]._id);
            setCommissionMin(list[0].commissionMin);
            setCommissionMax(list[0].commissionMax);
            setCurrentOffer(list[0].currentOffer);
            setCreatorName(list[0].creatorId?.channelTitle || 'Creator');
          }
        }
      } catch (err) {
        console.error('Failed to load negotiations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNegotiations();
  }, []);

  const handleSelectNegotiation = (neg: NegotiationItem) => {
    setSelectedNegId(neg._id);
    setCommissionMin(neg.commissionMin);
    setCommissionMax(neg.commissionMax);
    setCurrentOffer(neg.currentOffer);
    setCreatorName(neg.creatorId?.channelTitle || 'Creator');
    if (neg.messages && neg.messages.length > 0) {
      const lastCreatorMsg = [...neg.messages].reverse().find((m) => m.role === 'creator');
      if (lastCreatorMsg) {
        setReplyInput(lastCreatorMsg.message);
      }
    }
  };

  const handleAnalyzeReply = async (customText?: string) => {
    const textToAnalyze = customText || replyInput;
    if (!textToAnalyze.trim()) return;

    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await api.post('/negotiations/analyze-reply', {
        replyMessage: textToAnalyze,
        commissionMin,
        commissionMax,
        brandName,
        currentOffer,
        creatorName,
      });
      setAnalysis(res.data.analysis);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setStatusMessage('Analysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSample = (sampleText: string) => {
    setReplyInput(sampleText);
    handleAnalyzeReply(sampleText);
  };

  const copyToClipboard = () => {
    if (!analysis?.draftResponse) return;
    navigator.clipboard.writeText(analysis.draftResponse);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div className="dash-page-wrapper">
      {/* Header */}
      <section className="dash-hero-banner">
        <div className="dash-hero-left">
          <div className="dash-hero-chips">
            <span className="dash-live-badge">
              <span className="dash-pulse-dot"></span>
              AI Copilot Online
            </span>
            <span className="dash-plan-badge">
              Guardrail Protection: {commissionMin}% – {commissionMax}% Commission Max
            </span>
          </div>

          <h1 className="dash-hero-title">
            AI Reply Sentiment & <span className="dash-user-name">Negotiation Copilot</span>
          </h1>
          <p className="dash-hero-subtitle">
            Automatically detect creator sentiment, extract counter-offers or flat fees, and generate guardrail-bounded counter-offers with one-click reply drafting.
          </p>
        </div>

        <div className="dash-hero-actions">
          <Link href="/campaigns" className="dash-btn-glass">
            View Campaigns
          </Link>
          <Link href="/outreach" className="dash-btn-glass">
            Outreach Queue
          </Link>
        </div>
      </section>

      {/* Main Two Column Copilot Studio */}
      <div className="dash-main-grid">
        {/* Left: Interactive Reply Analyzer */}
        <div className="dash-col-left">
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Analyze Creator Reply</h2>
                <p className="dash-card-subtitle">
                  Paste any email received from an influencer or select a realistic scenario below
                </p>
              </div>
            </div>

            {/* Quick Sample Chips */}
            <div className="copilot-sample-chips">
              <span className="dash-prompt-chips-label">Try Scenarios:</span>
              {SAMPLE_REPLIES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="dash-prompt-chip"
                  onClick={() => handleLoadSample(s.text)}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Textarea Input */}
            <div className="copilot-input-wrap">
              <textarea
                className="copilot-textarea"
                rows={5}
                placeholder="Paste creator's incoming email here (e.g. 'I'd love to collaborate, but my minimum rate is 22% commission...')"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
              />
            </div>

            {/* Guardrail Controls */}
            <div className="copilot-guardrails-row">
              <div className="copilot-guard-item">
                <label className="dash-field-label">Min Commission</label>
                <input
                  type="number"
                  className="dash-discovery-input"
                  value={commissionMin}
                  onChange={(e) => setCommissionMin(Number(e.target.value))}
                />
              </div>
              <div className="copilot-guard-item">
                <label className="dash-field-label">Max Ceiling (Guardrail)</label>
                <input
                  type="number"
                  className="dash-discovery-input"
                  value={commissionMax}
                  onChange={(e) => setCommissionMax(Number(e.target.value))}
                />
              </div>
              <div className="copilot-guard-item">
                <label className="dash-field-label">Current Offer</label>
                <input
                  type="number"
                  className="dash-discovery-input"
                  value={currentOffer}
                  onChange={(e) => setCurrentOffer(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="dash-btn-primary full-width"
                onClick={() => handleAnalyzeReply()}
                disabled={analyzing || !replyInput.trim()}
              >
                {analyzing ? 'Analyzing Sentiment & Calculating Guardrails...' : '⚡ Analyze Sentiment & Generate Counter-Offer'}
              </button>
            </div>
          </div>

          {/* Analysis & AI Recommendations */}
          {analysis && (
            <div className="dash-card ai-glow-card">
              <div className="dash-card-header">
                <div className="dash-card-header-icon-title">
                  <span className="dash-ai-icon-chip">🎯 Sentiment & Copilot Verdict</span>
                  <h2 className="dash-card-title">Recommendation Summary</h2>
                </div>
                <div className={`copilot-sentiment-badge ${analysis.sentiment}`}>
                  {analysis.sentiment === 'counter_offer' && '🤝 Counter-Offer Detected'}
                  {analysis.sentiment === 'interested' && '⭐ High Interest'}
                  {analysis.sentiment === 'declined' && '❌ Declined'}
                  {analysis.sentiment === 'question' && '❓ Clarifying Inquiry'}
                </div>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="copilot-verdict-grid">
                <div className="copilot-verdict-card">
                  <div className="copilot-verdict-label">Detected Ask</div>
                  <div className="copilot-verdict-value">
                    {analysis.extractedRate !== null
                      ? `${analysis.extractedRate}%`
                      : analysis.extractedFlatFee !== null
                      ? `$${analysis.extractedFlatFee}`
                      : 'None specified'}
                  </div>
                </div>

                <div className="copilot-verdict-card">
                  <div className="copilot-verdict-label">Recommended Action</div>
                  <div className="copilot-verdict-value uppercase highlight">
                    {analysis.recommendedAction}
                  </div>
                </div>

                <div className="copilot-verdict-card">
                  <div className="copilot-verdict-label">Recommended Counter</div>
                  <div className="copilot-verdict-value text-green">
                    {analysis.recommendedRate}%
                  </div>
                </div>

                <div className="copilot-verdict-card">
                  <div className="copilot-verdict-label">Confidence</div>
                  <div className="copilot-verdict-value text-purple">
                    {analysis.confidence}%
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="copilot-rationale-box">
                <div className="copilot-rationale-title">AI Negotiation Rationale:</div>
                <p className="copilot-rationale-text">{analysis.rationale}</p>
              </div>

              {/* Drafted Response */}
              <div className="copilot-draft-box">
                <div className="copilot-draft-header">
                  <span className="copilot-draft-label">AI Drafted Counter Response:</span>
                  <button
                    type="button"
                    className="dash-prompt-chip"
                    onClick={copyToClipboard}
                  >
                    {copiedDraft ? '✓ Copied to Clipboard!' : '📋 Copy Draft'}
                  </button>
                </div>
                <pre className="copilot-draft-pre">{analysis.draftResponse}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Right: Active Negotiations Pipeline */}
        <div className="dash-col-right">
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">Live Negotiations Queue</h2>
                <p className="dash-card-subtitle">Active creator deals and counter-proposals</p>
              </div>
            </div>

            {loading ? (
              <div className="dash-empty-state">
                <div className="dash-spinner"></div>
                <p>Loading negotiations...</p>
              </div>
            ) : negotiations.length === 0 ? (
              <div className="dash-empty-state">
                <span className="dash-empty-icon">🤝</span>
                <p>No active negotiations found. Use the analyzer on the left to evaluate any creator reply.</p>
                <Link href="/campaigns" className="dash-btn-sm-primary">
                  Go to Campaigns
                </Link>
              </div>
            ) : (
              <div className="copilot-neg-list">
                {negotiations.map((neg) => (
                  <div
                    key={neg._id}
                    className={`copilot-neg-item ${selectedNegId === neg._id ? 'selected' : ''}`}
                    onClick={() => handleSelectNegotiation(neg)}
                  >
                    <div className="copilot-neg-top">
                      <span className="copilot-neg-name">{neg.creatorId?.channelTitle || 'Influencer'}</span>
                      <span className={`copilot-status-pill ${neg.status}`}>
                        {neg.status}
                      </span>
                    </div>
                    <div className="copilot-neg-meta">
                      <span>Round {neg.currentRound}/{neg.maxRounds}</span>
                      <span>·</span>
                      <span>Offer: {neg.currentOffer}%</span>
                      <span>·</span>
                      <span>Ceiling: {neg.commissionMax}%</span>
                    </div>
                    {neg.messages && neg.messages.length > 0 && (
                      <div className="copilot-neg-snippet">
                        &quot;{neg.messages[neg.messages.length - 1].message.slice(0, 80)}...&quot;
                      </div>
                    )}
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

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement forgot password API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-modern">
      <div className="auth-modern-left">
        <div className="auth-modern-content">
          <div className="auth-modern-logo">Ricoz</div>
          <h1 className="auth-modern-title">Welcome to Ricoz</h1>
          <p className="auth-modern-subtitle">
            Streamline your influencer marketing campaigns with AI-powered discovery, 
            automated outreach, and performance tracking.
          </p>
          <div className="auth-modern-features">
            <div className="auth-modern-feature">
              <div className="auth-modern-feature-icon">📊</div>
              <div className="auth-modern-feature-text">Track Performance</div>
            </div>
            <div className="auth-modern-feature">
              <div className="auth-modern-feature-icon">🎯</div>
              <div className="auth-modern-feature-text">Find the Right Influencers</div>
            </div>
            <div className="auth-modern-feature">
              <div className="auth-modern-feature-icon">🚀</div>
              <div className="auth-modern-feature-text">Grow Your Brand</div>
            </div>
          </div>
          <div className="auth-modern-illustration">
            <div className="auth-modern-laptop">
              <div className="auth-modern-screen">
                <div className="auth-modern-chart"></div>
                <div className="auth-modern-chart-line"></div>
              </div>
            </div>
            <div className="auth-modern-icons">
              <div className="auth-modern-icon" style={{ fontSize: '24px' }}>▶️</div>
              <div className="auth-modern-icon" style={{ fontSize: '24px' }}>📱</div>
              <div className="auth-modern-icon" style={{ fontSize: '24px' }}>💬</div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-modern-right">
        <div className="auth-modern-form-container">
          <div className="auth-modern-header">
            <Link href="/" className="auth-modern-logo-small">Ricoz</Link>
            <Link href="/login" className="auth-modern-signup-link">
              Back to Sign In →
            </Link>
          </div>
          <div className="auth-modern-form-wrapper">
            <h2 className="auth-modern-form-title">Forgot Password?</h2>
            <p className="auth-modern-form-subtitle">
              {submitted 
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive a password reset link'
              }
            </p>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" /> Sending...</> : <>Send Reset Link →</>}
                </button>
              </form>
            ) : (
              <div className="alert alert-success">
                Password reset link sent to {email}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/errorMessage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleOAuthButton } from '@/components/GoogleOAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Registration failed');
      setError(err.response?.status === 409 ? `${message} — try signing in instead.` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-page">
      {/* ─── TOP HEADER ─── */}
      <header className="auth-modern-topbar">
        <Link href="/" className="auth-modern-brand">
          <img
            src="/images/ricoz_card_logo_transparent.png"
            alt="Ricoz logo"
            className="auth-brand-logo-img"
          />
          <span className="auth-brand-name">Ricoz</span>
        </Link>
        <div className="auth-topbar-right">
          <span className="auth-topbar-text">Already have an account?</span>
          <Link href="/login" className="auth-topbar-link">
            Sign In →
          </Link>
        </div>
      </header>

      {/* ─── MAIN CONTENT (SPLIT) ─── */}
      <main className="auth-modern-container">
        {/* Left Hero & Visuals */}
        <section className="auth-modern-left-col">
          <div className="auth-badge-pill">
            <span className="auth-badge-sparkle">✦</span>
            <span>Smarter Growth. Together.</span>
          </div>

          <h1 className="auth-hero-heading">
            Join the future of<br />
            <span className="auth-gradient-brand">Influencer AI</span>
          </h1>

          <p className="auth-hero-sub">
            Streamline your influencer campaigns, connect with the right creators, and grow your brand effortlessly.
          </p>

          {/* 3 Features Row */}
          <div className="auth-feature-row">
            <div className="auth-feature-pill">
              <div className="auth-feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <path d="M4 11l4-4 4 4 6-6" />
                </svg>
              </div>
              <span className="auth-feature-label">Track<br />Performance</span>
            </div>

            <div className="auth-feature-pill">
              <div className="auth-feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="auth-feature-label">Find the Right<br />Influencers</span>
            </div>

            <div className="auth-feature-pill">
              <div className="auth-feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="auth-feature-label">Grow Your<br />Brand</span>
            </div>
          </div>

          {/* 3D Laptop with glowing orbits illustration */}
          <div className="auth-laptop-scene-wrap">
            <img
              src="/images/login_laptop_scene.png"
              alt="Ricoz 3D laptop with floating YouTube and Instagram icons"
              className="auth-laptop-scene-img"
            />
          </div>
        </section>

        {/* Right Form Card */}
        <section className="auth-modern-right-col">
          <div className="auth-card-box">
            {/* 3D Logo at top of card */}
            <div className="auth-card-logo-wrap">
              <img
                src="/images/ricoz_card_logo_transparent.png"
                alt="Ricoz 3D logo"
                className="auth-card-logo-img"
              />
            </div>

            <h2 className="auth-card-title">Create Account</h2>
            <p className="auth-card-subtitle">Set up your Ricoz account to get started</p>

            {error && (
              <div className="auth-error-alert" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body">
              {/* Full Name */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-name">
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e7891" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    className="auth-field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-email">
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e7891" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    className="auth-field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-password">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e7891" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-field-input with-toggle"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b859e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b859e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="register-submit"
                type="submit"
                className="auth-submit-btn"
                style={{ marginTop: 12 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-btn-spinner" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="auth-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-or-divider">
              <span>or</span>
            </div>

            {/* Google OAuth Button */}
            <div className="auth-google-wrap">
              <GoogleOAuthButton />
            </div>

            {/* Bottom Login Link */}
            <p className="auth-card-footer">
              Already have an account?{' '}
              <Link href="/login" className="auth-card-signup-link">
                Sign In
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

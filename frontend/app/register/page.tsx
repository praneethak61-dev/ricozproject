'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/errorMessage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  const handleGoogleLogin = () => {
    // Google OAuth implementation - placeholder for now
    alert('Google login will be implemented soon!');
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
              Already have an account? Sign In →
            </Link>
          </div>
          <div className="auth-modern-form-wrapper">
            <h2 className="auth-modern-form-title">Create Account</h2>
            <p className="auth-modern-form-subtitle">Set up your Ricoz account to get started</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                id="register-submit"
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Creating account...</> : <>Create Account →</>}
              </button>
            </form>
            <div className="auth-modern-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-block btn-lg"
              onClick={handleGoogleLogin}
            >
              <span className="google-icon">G</span>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

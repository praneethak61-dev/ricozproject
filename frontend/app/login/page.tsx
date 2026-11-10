'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/errorMessage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleOAuthButton } from '@/components/GoogleOAuth';

// Modern login page with split-screen design - updated to match mockup
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern">
      <div className="auth-modern-left">
        <div className="auth-modern-content">
          <div className="auth-modern-logo">Ricoz</div>
          <div className="auth-modern-tagline">Smarter Growth. Together.</div>
          <h1 className="auth-modern-title">Welcome to <span className="auth-modern-underline">Ricoz</span></h1>
          <p className="auth-modern-subtitle">
            Streamline your influencer campaigns, connect with the right creators, and grow your brand effortlessly.
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
                <div className="auth-modern-screen-logo">Ricoz</div>
                <div className="auth-modern-chart"></div>
                <div className="auth-modern-chart-line"></div>
              </div>
            </div>
            <div className="auth-modern-icons">
              <div className="auth-modern-icon youtube">▶️</div>
              <div className="auth-modern-icon instagram">📷</div>
              <div className="auth-modern-icon chart">�</div>
              <div className="auth-modern-icon users">�</div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-modern-right">
        <div className="auth-modern-form-container">
          <div className="auth-modern-header">
            <Link href="/" className="auth-modern-logo-small">Ricoz</Link>
            <Link href="/register" className="auth-modern-signup-link">
              Don&apos;t have an account? Sign Up →
            </Link>
          </div>
          <div className="auth-modern-form-wrapper">
            <div className="auth-modern-form-logo">Ricoz</div>
            <h2 className="auth-modern-form-title">Welcome Back</h2>
            <p className="auth-modern-form-subtitle">Sign in to your Ricoz account</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">📧</span>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              <div className="auth-modern-form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="auth-modern-forgot">
                  Forgot Password?
                </Link>
              </div>
              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Signing in...</> : <>→ Sign In</>}
              </button>
            </form>
            <div className="auth-modern-divider">
              <span>or</span>
            </div>
            <div className="google-oauth-wrapper">
              <GoogleOAuthButton />
            </div>
            <p className="auth-modern-form-footer">
              Don&apos;t have an account? <Link href="/register">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

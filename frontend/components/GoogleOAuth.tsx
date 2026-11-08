'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function GoogleOAuthButton() {
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Send the Google credential to your backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        console.error('Google login failed');
        alert('Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    alert('Google login failed. Please try again.');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        className="btn btn-outline btn-block btn-lg"
        onClick={() => alert('Google OAuth is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.')}
      >
        <span className="google-icon">G</span>
        Continue with Google
      </button>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </GoogleOAuthProvider>
  );
}

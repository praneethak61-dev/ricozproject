'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface BrandItem {
  _id: string;
  name: string;
  niche: string;
}

export default function DiscoveryRootPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await api.get('/brands');
        const list = res.data.brands || [];
        setBrands(list);
        if (list.length > 0) {
          router.replace(`/discovery/${list[0]._id}`);
        }
      } catch (err) {
        console.error('Failed to load brands:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBrands();
  }, [router]);

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-spinner"></div>
        <p>Loading Creator Discovery...</p>
      </div>
    );
  }

  return (
    <div className="dash-page-wrapper">
      <section className="dash-hero-banner">
        <div className="dash-hero-left">
          <h1 className="dash-hero-title">Multi-Platform Creator Discovery</h1>
          <p className="dash-hero-subtitle">
            Please create a brand profile to start discovering YouTube, Instagram Reels, and TikTok influencers matching your brand voice and target demographics.
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link href="/brands" className="dash-btn-primary">
            + Create Brand Profile
          </Link>
        </div>
      </section>
    </div>
  );
}

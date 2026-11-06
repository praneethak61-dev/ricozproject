/**
 * Multi-platform mock services for Instagram and TikTok discovery.
 * Since Instagram Graph API and TikTok API require business accounts and OAuth,
 * these services simulate discovery results to demonstrate multi-platform architecture.
 * In production, replace with real API integrations.
 */

interface PlatformCreator {
  channelId: string;
  channelTitle: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  contactEmail: string;
  platform: 'instagram' | 'tiktok';
}

// Simulated Instagram creator database
const instagramCreatorPool = [
  { handle: 'skincare.glow', name: 'Glow Up Skincare', niche: 'skincare beauty', followers: 45200, posts: 892, engagement: 4.2 },
  { handle: 'fit.lifestyle', name: 'Fitness Lifestyle Hub', niche: 'fitness health wellness', followers: 128000, posts: 1456, engagement: 3.8 },
  { handle: 'tech.daily', name: 'Tech Daily Reviews', niche: 'technology gadgets reviews', followers: 89500, posts: 634, engagement: 5.1 },
  { handle: 'foodie.adventures', name: 'Foodie Adventures', niche: 'food cooking recipes', followers: 67300, posts: 1203, engagement: 6.3 },
  { handle: 'fashion.forward', name: 'Fashion Forward', niche: 'fashion style clothing', followers: 156000, posts: 2341, engagement: 3.5 },
  { handle: 'travel.tales', name: 'Travel Tales', niche: 'travel adventure explore', followers: 93200, posts: 876, engagement: 4.7 },
  { handle: 'home.decor.inspo', name: 'Home Decor Inspo', niche: 'home decor interior design', followers: 34500, posts: 567, engagement: 5.8 },
  { handle: 'clean.beauty', name: 'Clean Beauty Co', niche: 'clean beauty organic skincare', followers: 28900, posts: 423, engagement: 7.1 },
  { handle: 'yoga.flow', name: 'Yoga Flow Studio', niche: 'yoga meditation wellness mindfulness', followers: 71200, posts: 945, engagement: 4.9 },
  { handle: 'pet.paradise', name: 'Pet Paradise', niche: 'pets dogs cats animals', followers: 112000, posts: 1678, engagement: 8.2 },
  { handle: 'eco.warrior', name: 'Eco Warrior', niche: 'sustainability eco-friendly green', followers: 41800, posts: 312, engagement: 6.0 },
  { handle: 'gaming.central', name: 'Gaming Central', niche: 'gaming esports streaming', followers: 203000, posts: 2100, engagement: 3.2 },
];

const tiktokCreatorPool = [
  { handle: 'beautyboss', name: 'Beauty Boss', niche: 'beauty makeup tutorial', followers: 320000, videos: 456, likes: 5200000, engagement: 5.5 },
  { handle: 'fitfam', name: 'FitFam Workouts', niche: 'fitness workout gym', followers: 189000, videos: 312, likes: 3800000, engagement: 4.8 },
  { handle: 'techgeek', name: 'Tech Geek Reviews', niche: 'technology phones gadgets', followers: 145000, videos: 278, likes: 2900000, engagement: 4.2 },
  { handle: 'cookwithlove', name: 'Cook With Love', niche: 'cooking recipe food', followers: 267000, videos: 534, likes: 7100000, engagement: 6.7 },
  { handle: 'stylechic', name: 'Style Chic', niche: 'fashion style outfit ootd', followers: 412000, videos: 678, likes: 9800000, engagement: 4.1 },
  { handle: 'wanderlust', name: 'Wanderlust Travels', niche: 'travel explore destinations', followers: 98000, videos: 156, likes: 1800000, engagement: 5.3 },
  { handle: 'diyhacks', name: 'DIY Hacks & Tips', niche: 'diy crafts home hacks', followers: 178000, videos: 289, likes: 4200000, engagement: 7.8 },
  { handle: 'skincaredaily', name: 'Skincare Daily', niche: 'skincare routine beauty clean', followers: 134000, videos: 234, likes: 2600000, engagement: 5.9 },
  { handle: 'mindsetcoach', name: 'Mindset Coach', niche: 'personal development motivation', followers: 89000, videos: 167, likes: 1500000, engagement: 4.5 },
  { handle: 'petlovers', name: 'Pet Lovers Club', niche: 'pets cute animals dogs cats', followers: 567000, videos: 890, likes: 15000000, engagement: 9.1 },
  { handle: 'greenlife', name: 'Green Life', niche: 'sustainability vegan eco organic', followers: 56000, videos: 123, likes: 980000, engagement: 6.2 },
  { handle: 'gamerzone', name: 'Gamer Zone', niche: 'gaming play stream esports', followers: 234000, videos: 445, likes: 5600000, engagement: 3.9 },
];

function matchKeywords(query: string, niche: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const nicheWords = niche.toLowerCase().split(/\s+/);
  let matches = 0;
  for (const qw of queryWords) {
    if (nicheWords.some((nw) => nw.includes(qw) || qw.includes(nw))) {
      matches++;
    }
  }
  return queryWords.length > 0 ? matches / queryWords.length : 0;
}

export async function searchInstagramCreators(
  query: string,
  maxResults: number = 10,
  minFollowers: number = 0
): Promise<PlatformCreator[]> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  const scored = instagramCreatorPool
    .filter((c) => c.followers >= minFollowers)
    .map((c) => ({ ...c, relevance: matchKeywords(query, c.niche) }))
    .filter((c) => c.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);

  return scored.map((c) => ({
    channelId: `ig_${c.handle}`,
    channelTitle: c.name,
    description: `Instagram creator specializing in ${c.niche}. ${c.followers.toLocaleString()} followers, ${c.posts} posts, ${c.engagement}% engagement rate.`,
    subscriberCount: c.followers,
    videoCount: c.posts,
    viewCount: Math.round(c.followers * c.engagement * c.posts * 0.01),
    thumbnailUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=E1306C&color=fff&size=128`,
    contactEmail: `${c.handle}@business.instagram.com`,
    platform: 'instagram' as const,
  }));
}

export async function searchTikTokCreators(
  query: string,
  maxResults: number = 10,
  minFollowers: number = 0
): Promise<PlatformCreator[]> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  const scored = tiktokCreatorPool
    .filter((c) => c.followers >= minFollowers)
    .map((c) => ({ ...c, relevance: matchKeywords(query, c.niche) }))
    .filter((c) => c.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);

  return scored.map((c) => ({
    channelId: `tt_${c.handle}`,
    channelTitle: c.name,
    description: `TikTok creator specializing in ${c.niche}. ${c.followers.toLocaleString()} followers, ${c.videos} videos, ${c.likes.toLocaleString()} total likes, ${c.engagement}% engagement rate.`,
    subscriberCount: c.followers,
    videoCount: c.videos,
    viewCount: Math.round(c.likes * 2.5),
    thumbnailUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=000000&color=69C9D0&size=128`,
    contactEmail: `${c.handle}@creator.tiktok.com`,
    platform: 'tiktok' as const,
  }));
}

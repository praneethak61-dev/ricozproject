import { IBrand } from '../models/Brand';
import { IRecentVideo } from '../models/Creator';

interface ScoringInput {
  channelTitle: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  recentVideos: IRecentVideo[];
}

interface ScoreBreakdown {
  niche: number;
  engagement: number;
  consistency: number;
}

interface ScoreResult {
  score: number;
  reason: string;
  breakdown: ScoreBreakdown;
  engagementRate: number;
}

/**
 * Computes a 0-100 fit score for a creator against a brand.
 *
 * Factors:
 *   - Niche match (40%): keyword overlap between brand niche/audience and channel content
 *   - Engagement (35%): view-to-subscriber ratio (higher = more engaged audience)
 *   - Posting consistency (25%): regularity of uploads in recent videos
 */
export function computeFitScore(brand: IBrand, creator: ScoringInput): ScoreResult {
  const nicheScore = computeNicheMatch(brand, creator);
  const engagementScore = computeEngagement(creator);
  const consistencyScore = computeConsistency(creator.recentVideos);
  const engagementRate = creator.subscriberCount > 0
    ? parseFloat(((creator.viewCount / creator.subscriberCount) * 100 / Math.max(creator.videoCount, 1)).toFixed(2))
    : 0;

  const totalScore = Math.round(
    nicheScore * 0.4 + engagementScore * 0.35 + consistencyScore * 0.25
  );

  const reasons: string[] = [];

  if (nicheScore >= 70) {
    reasons.push(`Strong niche alignment with "${brand.niche}"`);
  } else if (nicheScore >= 40) {
    reasons.push(`Moderate niche match with "${brand.niche}"`);
  } else {
    reasons.push(`Weak niche match — channel content doesn't closely align with "${brand.niche}"`);
  }

  if (engagementScore >= 70) {
    reasons.push('High audience engagement ratio');
  } else if (engagementScore >= 40) {
    reasons.push('Average audience engagement');
  } else {
    reasons.push('Low engagement relative to subscriber count');
  }

  if (consistencyScore >= 70) {
    reasons.push('Consistent upload schedule');
  } else if (consistencyScore >= 40) {
    reasons.push('Somewhat regular uploads');
  } else {
    reasons.push('Irregular posting pattern');
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    reason: reasons.join('. ') + '.',
    breakdown: {
      niche: Math.min(100, nicheScore),
      engagement: Math.min(100, engagementScore),
      consistency: Math.min(100, consistencyScore),
    },
    engagementRate,
  };
}

function computeNicheMatch(brand: IBrand, creator: ScoringInput): number {
  const brandKeywords = extractKeywords(
    `${brand.niche} ${brand.targetAudience} ${brand.name}`
  );

  const creatorText = `${creator.channelTitle} ${creator.description} ${creator.recentVideos
    .map((v) => v.title)
    .join(' ')}`;
  const creatorKeywords = extractKeywords(creatorText);

  const phrase = brand.niche.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const haystack = creatorText.toLowerCase().replace(/[-_]/g, ' ');
  const title = creator.channelTitle.toLowerCase().replace(/[-_]/g, ' ');
  let phraseScore = 0;
  if (phrase.length > 2 && haystack.includes(phrase)) {
    phraseScore = title.includes(phrase) ? 100 : 82;
  } else if (phrase) {
    const words = phrase.split(' ').filter((word) => word.length > 2);
    if (words.length > 0) {
      const hits = words.filter((word) => haystack.includes(word)).length;
      phraseScore = Math.round((hits / words.length) * 70);
    }
  }

  if (brandKeywords.length === 0) return phraseScore || 50;

  let matchCount = 0;
  for (const keyword of brandKeywords) {
    if (creatorKeywords.some((ck) => ck.includes(keyword) || keyword.includes(ck))) {
      matchCount++;
    }
  }

  const keywordScore = Math.min(100, Math.round((matchCount / brandKeywords.length) * 120));
  return Math.min(100, Math.round(keywordScore * 0.45 + phraseScore * 0.55));
}

function computeEngagement(creator: ScoringInput): number {
  if (creator.subscriberCount === 0) return 0;

  // Views per subscriber — a ratio of ~5-10 is very healthy for micro-influencers
  const viewsPerSub = creator.viewCount / creator.subscriberCount;

  if (viewsPerSub >= 10) return 100;
  if (viewsPerSub >= 5) return 85;
  if (viewsPerSub >= 2) return 70;
  if (viewsPerSub >= 1) return 55;
  if (viewsPerSub >= 0.5) return 40;
  return 20;
}

function computeConsistency(videos: IRecentVideo[]): number {
  if (videos.length < 2) return 30;

  const sortedDates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .sort((a, b) => b - a);

  // Calculate gaps between consecutive uploads in days
  const gaps: number[] = [];
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const gapDays = (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

  // Standard deviation of gaps — lower = more consistent
  const variance =
    gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Score based on average gap and consistency
  let score = 0;

  // Average gap score (weekly uploads = ideal)
  if (avgGap <= 7) score += 50;
  else if (avgGap <= 14) score += 40;
  else if (avgGap <= 30) score += 25;
  else score += 10;

  // Consistency score (low std dev = regular)
  if (stdDev <= 3) score += 50;
  else if (stdDev <= 7) score += 40;
  else if (stdDev <= 14) score += 25;
  else score += 10;

  return Math.min(100, score);
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'shall', 'would',
    'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
    'nor', 'not', 'no', 'so', 'if', 'when', 'that', 'this', 'these',
    'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she',
    'it', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too',
    'very', 'just', 'about', 'up', '',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

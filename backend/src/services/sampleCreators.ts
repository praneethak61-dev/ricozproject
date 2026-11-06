import { IBrand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { computeFitScore } from './scoring';

const LABELS = ['Lab', 'Diary', 'Notes', 'Routine', 'Desk', 'Journal', 'Studio', 'Daily'];

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function saveSampleCreators(brand: IBrand, minAudience: number, maxAudience: number) {
  const niche = brand.niche || 'skincare';
  const low = Math.max(1000, minAudience || 10000);
  const high = maxAudience > low ? maxAudience : Math.round(low * 3);
  const saved = [];

  for (let index = 0; index < LABELS.length; index++) {
    const span = high - low;
    const subscriberCount = Math.round(low + (span * (index + 1)) / (LABELS.length + 1));
    const channelTitle = `${titleCase(niche)} ${LABELS[index]}`;
    const description = `${channelTitle} films weekly ${niche} videos for a smaller, engaged audience.`;
    const recentVideos = [1, 2, 3].map((n) => ({
      videoId: `sample-${index}-${n}`,
      title: `${titleCase(niche)} routine ${n}`,
      publishedAt: new Date(Date.now() - n * 7 * 24 * 60 * 60 * 1000),
    }));
    const scored = computeFitScore(brand, {
      channelTitle,
      description,
      subscriberCount,
      videoCount: 36 + index * 4,
      viewCount: Math.round(subscriberCount * (9 - index * 0.35)),
      recentVideos,
    });

    const creator = await Creator.findOneAndUpdate(
      { brandId: brand._id, channelId: `sample_${brand._id}_${index}` },
      {
        brandId: brand._id,
        platform: 'youtube',
        channelId: `sample_${brand._id}_${index}`,
        channelTitle,
        description,
        subscriberCount,
        videoCount: 36 + index * 4,
        viewCount: Math.round(subscriberCount * (9 - index * 0.35)),
        thumbnailUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(channelTitle)}&background=241b43&color=ffffff&size=128`,
        contactEmail: `sample.${index + 1}@example.com`,
        recentVideos,
        fitScore: scored.score,
        fitReason: `${scored.reason} Sample channel, not a live YouTube result.`,
        scoreBreakdown: scored.breakdown,
        engagementRate: scored.engagementRate,
        brandSafetyScore: 90,
        brandSafetyFlags: [],
        sample: true,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    saved.push(creator);
  }

  saved.sort((a, b) => b.fitScore - a.fitScore);
  return saved;
}

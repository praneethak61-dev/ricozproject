export interface ParsedBrief {
  niche: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  minFollowers: number;
  maxFollowers: number;
  commissionMin: number;
  commissionMax: number;
}

function parseCommission(text: string): { commissionMin: number; commissionMax: number } | null {
  const range = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:to|-|–|and)\s*(\d+(?:\.\d+)?)\s*%/i);
  if (range) {
    return { commissionMin: Number(range[1]), commissionMax: Number(range[2]) };
  }

  const bounded = text.match(
    /(?:offer|pay)\s+(\d+(?:\.\d+)?)\s*%[\s\S]{0,120}?(?:never|not|don't|do not)\s+(?:go\s+|offer\s+)?(?:above|over|more than|exceed)\s+(\d+(?:\.\d+)?)\s*%/i
  );
  if (bounded) {
    return { commissionMin: Number(bounded[1]), commissionMax: Number(bounded[2]) };
  }

  return null;
}

function countFrom(amount: string, suffix?: string): number {
  const value = parseFloat(amount.replace(/,/g, ''));
  if (!Number.isFinite(value)) return NaN;
  if (suffix && suffix.toLowerCase() === 'k') return Math.round(value * 1000);
  if (suffix && suffix.toLowerCase() === 'm') return Math.round(value * 1_000_000);
  return Math.round(value);
}

/**
 * Reads a brand instruction such as:
 * "Find dog-training YouTubers with 10K to 100K followers, and offer 10% to 15% commission."
 */
export function parseBrief(prompt: string): ParsedBrief {
  const text = prompt.trim();

  const nicheMatch = text.match(/find\s+(.+?)\s+(youtubers?|instagrammers?|tiktokers?|creators?)/i);
  const niche = (nicheMatch?.[1] || '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let platform: ParsedBrief['platform'] = 'youtube';
  const platformWord = (nicheMatch?.[2] || text).toLowerCase();
  if (platformWord.includes('instagram')) platform = 'instagram';
  else if (platformWord.includes('tiktok')) platform = 'tiktok';
  else if (/instagram/i.test(text) && !/youtube/i.test(text)) platform = 'instagram';
  else if (/tiktok/i.test(text) && !/youtube/i.test(text)) platform = 'tiktok';

  const followers = text.match(/(\d[\d,]*)\s*([kKmM])?\s*(?:to|-|–)\s*(\d[\d,]*)\s*([kKmM])?\s*followers?/i);
  const commission = parseCommission(text);

  if (!niche) {
    throw new Error('Say who to find, for example “Find dog-training YouTubers”.');
  }
  if (!followers) {
    throw new Error('Include a follower range, for example “10K to 100K followers”.');
  }
  if (!commission) {
    throw new Error('Include a commission range, for example “offer 10% to 15%” or “offer 10%, never go above 20%”.');
  }

  const minFollowers = countFrom(followers[1], followers[2]);
  const maxFollowers = countFrom(followers[3], followers[4]);
  const { commissionMin, commissionMax } = commission;

  if (minFollowers >= maxFollowers) {
    throw new Error('The follower minimum must be lower than the maximum.');
  }
  if (commissionMin > commissionMax || commissionMin < 0 || commissionMax > 100) {
    throw new Error('Commission must be a range inside 0–100%, with the lower number first.');
  }

  return { niche, platform, minFollowers, maxFollowers, commissionMin, commissionMax };
}

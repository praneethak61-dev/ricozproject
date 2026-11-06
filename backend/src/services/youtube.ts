import axios from 'axios';
import { env } from '../config/env';
import { canUseQuota, useQuota } from '../utils/quota';
import { extractEmailFromText } from '../utils/helpers';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchResult {
  channelId: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
}

export interface YouTubeSearchPage {
  results: YouTubeSearchResult[];
  nextPageToken?: string;
}

interface YouTubeChannelDetails {
  channelId: string;
  channelTitle: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  contactEmail: string;
  uploadsPlaylistId: string;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: Date;
}

// search.list — 100 units per call
export async function searchCreators(
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchPage> {
  const cost = 100;
  if (!canUseQuota(cost)) {
    throw new Error('YouTube API daily quota exceeded. Try again tomorrow.');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'channel',
        q: query,
        maxResults: Math.min(maxResults, 50),
        pageToken,
        key: env.YOUTUBE_API_KEY,
      },
    });

    useQuota(cost);

    const items = response.data.items || [];
    return {
      results: items.map((item: any) => ({
        channelId: item.snippet.channelId || item.id.channelId,
        channelTitle: item.snippet.channelTitle || item.snippet.title,
        description: item.snippet.description || '',
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      })),
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded or API key invalid.');
    }
    throw new Error(`YouTube search failed: ${error.message}`);
  }
}

// channels.list — 1 unit per call (up to 50 channels)
export async function getChannelDetails(
  channelIds: string[]
): Promise<YouTubeChannelDetails[]> {
  const cost = 1;
  if (!canUseQuota(cost)) {
    throw new Error('YouTube API daily quota exceeded. Try again tomorrow.');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: channelIds.join(','),
        key: env.YOUTUBE_API_KEY,
      },
    });

    useQuota(cost);

    return response.data.items.map((item: any) => ({
      channelId: item.id,
      channelTitle: item.snippet.title,
      description: item.snippet.description || '',
      subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
      videoCount: parseInt(item.statistics.videoCount || '0', 10),
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
      contactEmail: extractEmailFromText(item.snippet.description || ''),
      uploadsPlaylistId:
        item.contentDetails?.relatedPlaylists?.uploads || '',
    }));
  } catch (error: any) {
    throw new Error(`Channel details fetch failed: ${error.message}`);
  }
}

// playlistItems.list — 1 unit per call
export async function getRecentVideos(
  playlistId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  if (!playlistId) return [];

  const cost = 1;
  if (!canUseQuota(cost)) {
    throw new Error('YouTube API daily quota exceeded. Try again tomorrow.');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId,
        maxResults: Math.min(maxResults, 10),
        key: env.YOUTUBE_API_KEY,
      },
    });

    useQuota(cost);

    return response.data.items.map((item: any) => ({
      videoId: item.snippet.resourceId?.videoId || '',
      title: item.snippet.title || '',
      publishedAt: new Date(item.snippet.publishedAt),
    }));
  } catch (error: any) {
    console.warn(`Failed to fetch videos for playlist ${playlistId}:`, error.message);
    return [];
  }
}

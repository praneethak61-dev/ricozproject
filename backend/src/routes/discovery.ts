import { Router, Response } from 'express';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { searchCreators, getChannelDetails, getRecentVideos } from '../services/youtube';
import { searchInstagramCreators, searchTikTokCreators } from '../services/platformDiscovery';
import { computeFitScore } from '../services/scoring';
import { analyzeBrandSafety } from '../services/sentimentAnalysis';
import { getQuotaStatus } from '../utils/quota';
import { logActivity } from '../services/activityLog';
import { addCreatorToActiveCampaign } from '../services/pipeline';
import { saveSampleCreators } from '../services/sampleCreators';
import { Brief } from '../models/Brief';
import { Campaign } from '../models/Campaign';

const router = Router();

// POST /api/discovery/:brandId/search — trigger creator discovery (multi-platform)
router.post('/:brandId/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const query = (req.body.query as string) || `${brand.niche} ${brand.targetAudience}`;
    const maxResults = Math.min(Number(req.body.maxResults) || 10, 50);
    const platforms: string[] = req.body.platforms || ['youtube'];
    const minAudience = Number(req.body.minAudienceSize ?? brand.minAudienceSize);
    const maxAudience = Number(req.body.maxAudienceSize ?? brand.maxAudienceSize ?? 0);

    const allCreators: any[] = [];
    let youtubeWarning = '';
    let youtubeSaved = 0;
    let youtubeFailed = false;

    // YouTube Discovery — keep paging until the follower band is filled (up to 50)
    if (platforms.includes('youtube')) {
      try {
        const matchedChannels = [];
        const seen = new Set<string>();
        let pageToken: string | undefined;

        for (let page = 0; page < 8 && matchedChannels.length < maxResults; page++) {
          const searchPage = await searchCreators(query, 50, pageToken);
          const freshIds = searchPage.results
            .map((result) => result.channelId)
            .filter((id) => id && !seen.has(id));
          freshIds.forEach((id) => seen.add(id));

          if (freshIds.length > 0) {
            const channelDetails = await getChannelDetails(freshIds);
            for (const channel of channelDetails) {
              if (channel.subscriberCount < minAudience) continue;
              if (maxAudience > 0 && channel.subscriberCount > maxAudience) continue;
              matchedChannels.push(channel);
              if (matchedChannels.length >= maxResults) break;
            }
          }

          if (!searchPage.nextPageToken || freshIds.length === 0) break;
          pageToken = searchPage.nextPageToken;
        }

        for (const channel of matchedChannels) {
            const recentVideos = await getRecentVideos(channel.uploadsPlaylistId, 10);

            const { score, reason, breakdown, engagementRate } = computeFitScore(brand, {
              channelTitle: channel.channelTitle,
              description: channel.description,
              subscriberCount: channel.subscriberCount,
              videoCount: channel.videoCount,
              viewCount: channel.viewCount,
              recentVideos: recentVideos.map((v) => ({
                videoId: v.videoId,
                title: v.title,
                publishedAt: v.publishedAt,
              })),
            });

            // Brand safety analysis
            let safetyResult = { safetyScore: 80, flags: [] as string[] };
            try {
              safetyResult = await analyzeBrandSafety(
                channel.channelTitle,
                channel.description,
                recentVideos.map((v) => v.title)
              );
            } catch {}

            const creator = await Creator.findOneAndUpdate(
              { brandId: brand._id, channelId: channel.channelId },
              {
                brandId: brand._id,
                platform: 'youtube',
                channelId: channel.channelId,
                channelTitle: channel.channelTitle,
                description: channel.description,
                subscriberCount: channel.subscriberCount,
                videoCount: channel.videoCount,
                viewCount: channel.viewCount,
                thumbnailUrl: channel.thumbnailUrl,
                contactEmail: channel.contactEmail,
                recentVideos: recentVideos.map((v) => ({
                  videoId: v.videoId,
                  title: v.title,
                  publishedAt: v.publishedAt,
                })),
                fitScore: score,
                fitReason: reason,
                scoreBreakdown: breakdown,
                engagementRate,
                brandSafetyScore: safetyResult.safetyScore,
                brandSafetyFlags: safetyResult.flags,
                sample: false,
                fetchedAt: new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            allCreators.push(creator);
            youtubeSaved += 1;
        }
      } catch (err: any) {
        youtubeFailed = true;
        youtubeWarning = err.message || 'YouTube search failed';
        console.warn('YouTube discovery error:', youtubeWarning);
      }
    }

    let sampleData = false;
    if (platforms.includes('youtube') && youtubeFailed && youtubeSaved === 0) {
      const samples = await saveSampleCreators(brand, minAudience, maxAudience);
      allCreators.push(...samples);
      sampleData = true;
    } else if (youtubeSaved > 0) {
      await Creator.deleteMany({ brandId: brand._id, sample: true });
    }

    // Instagram Discovery (simulated)
    if (platforms.includes('instagram')) {
      try {
        const igResults = await searchInstagramCreators(query, maxResults, minAudience);

        for (const ig of igResults) {
          if (maxAudience > 0 && ig.subscriberCount > maxAudience) continue;
          const { score, reason, breakdown, engagementRate } = computeFitScore(brand, {
            channelTitle: ig.channelTitle,
            description: ig.description,
            subscriberCount: ig.subscriberCount,
            videoCount: ig.videoCount,
            viewCount: ig.viewCount,
            recentVideos: [],
          });

          const creator = await Creator.findOneAndUpdate(
            { brandId: brand._id, channelId: ig.channelId },
            {
              brandId: brand._id,
              platform: 'instagram',
              channelId: ig.channelId,
              channelTitle: ig.channelTitle,
              description: ig.description,
              subscriberCount: ig.subscriberCount,
              videoCount: ig.videoCount,
              viewCount: ig.viewCount,
              thumbnailUrl: ig.thumbnailUrl,
              contactEmail: ig.contactEmail,
              recentVideos: [],
              fitScore: score,
              fitReason: reason,
              scoreBreakdown: breakdown,
              engagementRate,
              brandSafetyScore: 80,
              brandSafetyFlags: [],
              status: 'pending',
              fetchedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          allCreators.push(creator);
        }
      } catch (err: any) {
        console.warn('Instagram discovery error:', err.message);
      }
    }

    // TikTok Discovery (simulated)
    if (platforms.includes('tiktok')) {
      try {
        const ttResults = await searchTikTokCreators(query, maxResults, minAudience);

        for (const tt of ttResults) {
          if (maxAudience > 0 && tt.subscriberCount > maxAudience) continue;
          const { score, reason, breakdown, engagementRate } = computeFitScore(brand, {
            channelTitle: tt.channelTitle,
            description: tt.description,
            subscriberCount: tt.subscriberCount,
            videoCount: tt.videoCount,
            viewCount: tt.viewCount,
            recentVideos: [],
          });

          const creator = await Creator.findOneAndUpdate(
            { brandId: brand._id, channelId: tt.channelId },
            {
              brandId: brand._id,
              platform: 'tiktok',
              channelId: tt.channelId,
              channelTitle: tt.channelTitle,
              description: tt.description,
              subscriberCount: tt.subscriberCount,
              videoCount: tt.videoCount,
              viewCount: tt.viewCount,
              thumbnailUrl: tt.thumbnailUrl,
              contactEmail: tt.contactEmail,
              recentVideos: [],
              fitScore: score,
              fitReason: reason,
              scoreBreakdown: breakdown,
              engagementRate,
              brandSafetyScore: 85,
              brandSafetyFlags: [],
              status: 'pending',
              fetchedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          allCreators.push(creator);
        }
      } catch (err: any) {
        console.warn('TikTok discovery error:', err.message);
      }
    }

    // Sort by fit score descending
    allCreators.sort((a, b) => b.fitScore - a.fitScore);

    const samplePlatforms = platforms.filter((p) => p === 'instagram' || p === 'tiktok');
    const prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
    let briefId: string | undefined;
    if (prompt) {
      const campaign = await Campaign.findOne({
        userId: req.user!.userId,
        brandId: brand._id,
        status: 'active',
      }).sort({ createdAt: -1 });
      const brief = await Brief.create({
        userId: req.user!.userId,
        brandId: brand._id,
        campaignId: campaign?._id,
        prompt,
        niche: brand.niche,
        minFollowers: minAudience,
        maxFollowers: maxAudience,
        commissionMin: campaign?.commissionMin ?? 0,
        commissionMax: campaign?.commissionMax ?? 0,
        creatorCount: allCreators.length,
        creatorIds: allCreators.map((creator) => creator._id),
        sample: sampleData,
      });
      briefId = brief._id.toString();
    }

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'search',
      message: sampleData
        ? `YouTube was unavailable, so Ricoz saved ${allCreators.length} sample creators for “${brand.niche}”.`
        : `Searched ${platforms.join(', ')} for “${brand.niche}” and saved ${allCreators.length} creators.`,
      meta: { platforms, count: allCreators.length, samplePlatforms, sampleData },
    });

    res.json({
      message: sampleData
        ? `YouTube was unavailable. Showing ${allCreators.length} sample creators, not live YouTube.`
        : `Found ${allCreators.length} creators across ${platforms.join(', ')}`,
      quota: getQuotaStatus(),
      platforms,
      creators: allCreators,
      sampleData,
      briefId,
      youtubeWarning: youtubeWarning || undefined,
    });
  } catch (error: any) {
    console.error('Discovery error:', error);
    res.status(error.message?.includes('quota') ? 429 : 500).json({
      error: error.message?.includes('quota') ? 'Quota Exceeded' : 'Internal Server Error',
      message: error.message || 'Discovery failed',
    });
  }
});

// GET /api/discovery/:brandId/creators — list discovered creators
router.get('/:brandId/creators', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const status = req.query.status as string | undefined;
    const platform = req.query.platform as string | undefined;
    const filter: any = { brandId: brand._id };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    if (platform && ['youtube', 'instagram', 'tiktok'].includes(platform)) {
      filter.platform = platform;
    }

    const creators = await Creator.find(filter).sort({ fitScore: -1 });

    const blacklistMap = new Map<string, string>();
    if (brand.blacklist && Array.isArray(brand.blacklist)) {
      for (const b of brand.blacklist) {
        blacklistMap.set(b.channelTitle.toLowerCase().trim(), b.reason);
      }
    }

    const enhancedCreators = creators.map((c) => {
      const obj = c.toObject();
      const reason = blacklistMap.get(c.channelTitle.toLowerCase().trim());
      return {
        ...obj,
        isBlacklisted: !!reason,
        blacklistReason: reason || null,
      };
    });

    res.json({ creators: enhancedCreators });
  } catch (error) {
    console.error('List creators error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch creators' });
  }
});

// PATCH /api/discovery/creators/:id/status — approve or reject
router.patch('/creators/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Bad Request', message: 'Status must be "approved" or "rejected"' });
      return;
    }

    const creator = await Creator.findById(req.params.id).populate('brandId');
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    // Verify ownership through brand
    const brand = await Brand.findOne({ _id: creator.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    creator.status = status;
    await creator.save();

    let pipeline: { added: boolean; campaignId?: string; campaignName?: string } = { added: false };
    if (status === 'approved') {
      const campaign = await addCreatorToActiveCampaign(req.user!.userId, brand._id, creator._id);
      if (campaign) {
        pipeline = { added: true, campaignId: campaign._id.toString(), campaignName: campaign.name };
      }
    }

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: status === 'approved' ? 'approve' : 'reject',
      message:
        status === 'approved'
          ? pipeline.added
            ? `Approved ${creator.channelTitle} and added them to “${pipeline.campaignName}” as Discovered.`
            : `Approved ${creator.channelTitle}. Create an active campaign to place them on the pipeline.`
          : `Rejected ${creator.channelTitle}.`,
      meta: { creatorId: creator._id.toString(), platform: creator.platform },
    });

    res.json({ message: `Creator ${status}`, creator, pipeline });
  } catch (error) {
    console.error('Update creator status error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update status' });
  }
});

// GET /api/discovery/quota/status — check YouTube API quota status
router.get('/quota/status', authMiddleware, async (_req: AuthRequest, res: Response) => {
  res.json({ quota: getQuotaStatus() });
});

export default router;

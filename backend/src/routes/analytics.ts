import { Router, Response } from 'express';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { Outreach } from '../models/Outreach';
import { Campaign } from '../models/Campaign';
import { Deliverable } from '../models/Deliverable';
import { Negotiation } from '../models/Negotiation';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/overview — Aggregated dashboard stats
router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const brands = await Brand.find({ userId });
    const brandIds = brands.map((b) => b._id);

    const [
      totalCreators,
      approvedCreators,
      totalOutreach,
      sentOutreach,
      failedOutreach,
      totalCampaigns,
      activeCampaigns,
      totalDeliverables,
      liveDeliverables,
      totalNegotiations,
      agreedNegotiations,
    ] = await Promise.all([
      Creator.countDocuments({ brandId: { $in: brandIds } }),
      Creator.countDocuments({ brandId: { $in: brandIds }, status: 'approved' }),
      Outreach.countDocuments({ brandId: { $in: brandIds } }),
      Outreach.countDocuments({ brandId: { $in: brandIds }, status: 'sent' }),
      Outreach.countDocuments({ brandId: { $in: brandIds }, status: 'failed' }),
      Campaign.countDocuments({ userId }),
      Campaign.countDocuments({ userId, status: 'active' }),
      Deliverable.countDocuments({ brandId: { $in: brandIds } }),
      Deliverable.countDocuments({ brandId: { $in: brandIds }, status: 'live' }),
      Negotiation.countDocuments({ brandId: { $in: brandIds } }),
      Negotiation.countDocuments({ brandId: { $in: brandIds }, status: 'agreed' }),
    ]);

    // Average fit score
    const avgScoreResult = await Creator.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: null, avgScore: { $avg: '$fitScore' } } },
    ]);
    const avgFitScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Platform distribution
    const platformDist = await Creator.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);

    res.json({
      overview: {
        brands: brands.length,
        totalCreators,
        approvedCreators,
        totalOutreach,
        sentOutreach,
        failedOutreach,
        draftOutreach: totalOutreach - sentOutreach - failedOutreach,
        totalCampaigns,
        activeCampaigns,
        totalDeliverables,
        liveDeliverables,
        totalNegotiations,
        agreedNegotiations,
        avgFitScore,
        responseRate: totalOutreach > 0 ? Math.round((sentOutreach / totalOutreach) * 100) : 0,
        platformDistribution: platformDist.map((p) => ({
          platform: p._id || 'youtube',
          count: p.count,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/scoring-distribution — Score histogram
router.get('/scoring-distribution', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brandIds = (await Brand.find({ userId: req.user!.userId })).map((b) => b._id);

    const distribution = await Creator.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      {
        $bucket: {
          groupBy: '$fitScore',
          boundaries: [0, 21, 41, 61, 81, 101],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const labels = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const data = labels.map((label, i) => {
      const boundary = [0, 21, 41, 61, 81][i];
      const found = distribution.find((d: any) => d._id === boundary);
      return { range: label, count: found ? found.count : 0 };
    });

    res.json({ distribution: data });
  } catch (error) {
    console.error('Scoring distribution error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch distribution' });
  }
});

// GET /api/analytics/outreach-timeline — Outreach over time
router.get('/outreach-timeline', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brandIds = (await Brand.find({ userId: req.user!.userId })).map((b) => b._id);

    const timeline = await Outreach.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Transform into chart-friendly format
    const dateMap: Record<string, { date: string; sent: number; draft: number; failed: number }> = {};
    for (const entry of timeline) {
      const date = entry._id.date;
      if (!dateMap[date]) dateMap[date] = { date, sent: 0, draft: 0, failed: 0 };
      dateMap[date][entry._id.status as 'sent' | 'draft' | 'failed'] = entry.count;
    }

    res.json({ timeline: Object.values(dateMap) });
  } catch (error) {
    console.error('Outreach timeline error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch timeline' });
  }
});

// GET /api/analytics/campaign-funnel — Pipeline stage counts
router.get('/campaign-funnel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user!.userId });

    const funnel = { discovered: 0, contacted: 0, responded: 0, negotiating: 0, contracted: 0 };
    for (const campaign of campaigns) {
      for (const creator of campaign.creators) {
        funnel[creator.stage]++;
      }
    }

    res.json({
      funnel: Object.entries(funnel).map(([stage, count]) => ({ stage, count })),
    });
  } catch (error) {
    console.error('Campaign funnel error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch funnel' });
  }
});

// GET /api/analytics/top-creators — Top 5 by fit score
router.get('/top-creators', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brandIds = (await Brand.find({ userId: req.user!.userId })).map((b) => b._id);

    const topCreators = await Creator.find({ brandId: { $in: brandIds } })
      .sort({ fitScore: -1 })
      .limit(5)
      .select('channelTitle platform fitScore subscriberCount thumbnailUrl engagementRate brandSafetyScore');

    res.json({ topCreators });
  } catch (error) {
    console.error('Top creators error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch top creators' });
  }
});

export default router;

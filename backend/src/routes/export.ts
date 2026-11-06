import { Router, Response } from 'express';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { Campaign } from '../models/Campaign';
import { Deliverable } from '../models/Deliverable';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/export/:brandId/creators/csv — Export creators as CSV
router.get('/:brandId/creators/csv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const creators = await Creator.find({ brandId: brand._id }).sort({ fitScore: -1 });

    // Build CSV
    const headers = [
      'Channel Name',
      'Platform',
      'Channel ID',
      'Subscribers',
      'Videos',
      'Total Views',
      'Fit Score',
      'Engagement Rate',
      'Brand Safety Score',
      'Status',
      'Contact Email',
      'Fit Reason',
    ];

    const rows = creators.map((c) => [
      `"${c.channelTitle.replace(/"/g, '""')}"`,
      c.platform || 'youtube',
      c.channelId,
      c.subscriberCount,
      c.videoCount,
      c.viewCount,
      c.fitScore,
      c.engagementRate || 0,
      c.brandSafetyScore || 100,
      c.status,
      c.contactEmail,
      `"${(c.fitReason || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${brand.name}_creators_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export creators error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export creators' });
  }
});

// GET /api/export/:campaignId/report/csv — Export campaign report as CSV
router.get('/:campaignId/report/csv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user!.userId })
      .populate('creators.creatorId', 'channelTitle platform fitScore subscriberCount contactEmail');

    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const deliverables = await Deliverable.find({ campaignId: campaign._id })
      .populate('creatorId', 'channelTitle');

    const headers = ['Creator', 'Platform', 'Pipeline Stage', 'Commission Rate', 'Fit Score', 'Deliverables', 'Live Deliverables'];

    const rows = campaign.creators.map((entry: any) => {
      const creator = entry.creatorId;
      const creatorDeliverables = deliverables.filter((d: any) => d.creatorId?._id?.toString() === creator?._id?.toString());
      const liveCount = creatorDeliverables.filter((d) => d.status === 'live').length;

      return [
        `"${creator?.channelTitle || 'Unknown'}"`,
        creator?.platform || 'youtube',
        entry.stage,
        entry.commissionRate ? `${entry.commissionRate}%` : 'N/A',
        creator?.fitScore || 0,
        creatorDeliverables.length,
        liveCount,
      ];
    });

    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${campaign.name}_report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export report' });
  }
});

export default router;

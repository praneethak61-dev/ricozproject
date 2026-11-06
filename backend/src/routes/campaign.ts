import { Router, Response } from 'express';
import { z } from 'zod';
import { Campaign } from '../models/Campaign';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { Outreach } from '../models/Outreach';
import { Deliverable } from '../models/Deliverable';
import { Negotiation } from '../models/Negotiation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logActivity } from '../services/activityLog';

const router = Router();

const campaignSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1).max(200),
  goal: z.string().min(1).max(500),
  budget: z.number().min(0),
  targetDemographic: z.string().min(1).max(500),
  commissionMin: z.number().min(0).max(100).default(5),
  commissionMax: z.number().min(0).max(100).default(25),
});

// POST /api/campaigns — Create campaign
router.post('/', authMiddleware, validate(campaignSchema), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.body.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    if (req.body.commissionMin > req.body.commissionMax) {
      res.status(400).json({ error: 'Bad Request', message: 'Min commission must be less than max' });
      return;
    }

    const campaign = await Campaign.create({
      ...req.body,
      userId: req.user!.userId,
    });
    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'campaign',
      message: `Opened campaign “${campaign.name}” with a ${campaign.commissionMin}–${campaign.commissionMax}% commission range and a $${campaign.budget} budget.`,
      meta: { campaignId: campaign._id.toString() },
    });
    res.status(201).json({ message: 'Campaign created', campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create campaign' });
  }
});

// GET /api/campaigns — List user's campaigns
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user!.userId })
      .populate('brandId', 'name niche')
      .sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id/report — one-page summary for the brand
router.get('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!.userId })
      .populate('brandId', 'name niche productPrice')
      .populate('creators.creatorId', 'channelTitle subscriberCount fitScore status sample platform');
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const brandId = (campaign.brandId as { _id?: unknown })._id || campaign.brandId;
    const creatorIds = campaign.creators.map((entry) => {
      const value = entry.creatorId as { _id?: unknown };
      return value && typeof value === 'object' && value._id ? value._id : entry.creatorId;
    });
    const [outreach, deliverables, negotiations] = await Promise.all([
      Outreach.find({ brandId, creatorId: { $in: creatorIds } }).populate('creatorId', 'channelTitle'),
      Deliverable.find({ campaignId: campaign._id }).populate('creatorId', 'channelTitle'),
      Negotiation.find({ campaignId: campaign._id }).populate('creatorId', 'channelTitle'),
    ]);

    res.json({
      campaign,
      outreach,
      deliverables,
      negotiations,
      posted: deliverables.filter((item) => item.status === 'live'),
    });
  } catch (error) {
    console.error('Campaign report error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not build the report' });
  }
});

// GET /api/campaigns/:id — Get single campaign with populated creators
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!.userId })
      .populate('brandId', 'name niche')
      .populate('creators.creatorId', 'channelTitle channelId platform fitScore subscriberCount thumbnailUrl');

    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch campaign' });
  }
});

// PUT /api/campaigns/:id — Update campaign
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }
    res.json({ message: 'Campaign updated', campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete campaign' });
  }
});

// POST /api/campaigns/:id/creators — Add creator to campaign pipeline
router.post('/:id/creators', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const { creatorId } = req.body;
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    // Check if creator already in campaign
    const existing = campaign.creators.find((c) => c.creatorId.toString() === creatorId);
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Creator already in this campaign' });
      return;
    }

    campaign.creators.push({
      creatorId,
      stage: 'discovered',
      movedAt: new Date(),
    });
    await campaign.save();

    res.json({ message: 'Creator added to campaign', campaign });
  } catch (error) {
    console.error('Add creator to campaign error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add creator' });
  }
});

// PATCH /api/campaigns/:id/creators/:creatorId/stage — Move creator through pipeline
router.patch('/:id/creators/:creatorId/stage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const { stage } = req.body;
    const validStages = ['discovered', 'contacted', 'responded', 'negotiating', 'contracted'];
    if (!validStages.includes(stage)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid pipeline stage' });
      return;
    }

    const creatorEntry = campaign.creators.find(
      (c) => c.creatorId.toString() === req.params.creatorId
    );
    if (!creatorEntry) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found in this campaign' });
      return;
    }

    creatorEntry.stage = stage;
    creatorEntry.movedAt = new Date();
    if (req.body.commissionRate !== undefined) {
      creatorEntry.commissionRate = req.body.commissionRate;
    }
    if (req.body.agreedTerms) {
      creatorEntry.agreedTerms = req.body.agreedTerms;
    }

    await campaign.save();
    res.json({ message: `Creator moved to ${stage}`, campaign });
  } catch (error) {
    console.error('Update pipeline stage error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update stage' });
  }
});

export default router;

import { Router, Response } from 'express';
import { Negotiation } from '../models/Negotiation';
import { Campaign } from '../models/Campaign';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateNegotiationResponse } from '../services/negotiationEngine';
import { logActivity } from '../services/activityLog';
import { closeAgreedDeal } from '../services/pipeline';

const router = Router();

// POST /api/negotiations — Start a new negotiation
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, creatorId } = req.body;

    const campaign = await Campaign.findOne({ _id: campaignId, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const brand = await Brand.findById(campaign.brandId);
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const creator = await Creator.findById(creatorId);
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    // Check for existing active negotiation
    const existing = await Negotiation.findOne({
      campaignId,
      creatorId,
      status: { $in: ['pending', 'in_progress'] },
    });
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Active negotiation already exists', negotiation: existing });
      return;
    }

    const initialOffer = campaign.commissionMin + 2;

    const negotiation = await Negotiation.create({
      campaignId,
      brandId: campaign.brandId,
      creatorId,
      commissionMin: campaign.commissionMin,
      commissionMax: campaign.commissionMax,
      currentOffer: initialOffer,
      status: 'pending',
    });

    // Generate initial offer using AI
    const aiResponse = await generateNegotiationResponse(
      negotiation,
      creator.channelTitle,
      brand.name
    );

    negotiation.messages.push({
      role: 'ai_agent',
      message: aiResponse.message,
      proposedRate: aiResponse.proposedRate,
      timestamp: new Date(),
    });
    negotiation.currentOffer = aiResponse.proposedRate;
    negotiation.currentRound = 1;
    negotiation.status = 'in_progress';
    await negotiation.save();

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'negotiate',
      message: `Opened negotiation with ${creator.channelTitle}. First offer is ${aiResponse.proposedRate}% (allowed ${campaign.commissionMin}–${campaign.commissionMax}%).`,
      meta: { negotiationId: negotiation._id.toString(), proposedRate: aiResponse.proposedRate },
    });

    // Update campaign pipeline stage
    const campaignCreator = campaign.creators.find((c) => c.creatorId.toString() === creatorId);
    if (campaignCreator) {
      campaignCreator.stage = 'negotiating';
      campaignCreator.movedAt = new Date();
      await campaign.save();
    }

    res.status(201).json({
      message: 'Negotiation started',
      negotiation,
      aiResponse,
    });
  } catch (error: any) {
    console.error('Start negotiation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to start negotiation' });
  }
});

// GET /api/negotiations/brand/:brandId — List negotiations for a brand
router.get('/brand/:brandId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const negotiations = await Negotiation.find({ brandId: brand._id })
      .populate('creatorId', 'channelTitle channelId platform fitScore thumbnailUrl')
      .populate('campaignId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ negotiations });
  } catch (error) {
    console.error('List negotiations error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch negotiations' });
  }
});

// GET /api/negotiations/campaign/:campaignId — negotiations inside one campaign
router.get('/campaign/:campaignId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const negotiations = await Negotiation.find({ campaignId: campaign._id })
      .populate('creatorId', 'channelTitle channelId platform fitScore thumbnailUrl subscriberCount')
      .sort({ updatedAt: -1 });

    res.json({ negotiations });
  } catch (error) {
    console.error('List campaign negotiations error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch negotiations' });
  }
});

// GET /api/negotiations/:id — Get single negotiation with messages
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('creatorId', 'channelTitle channelId platform fitScore thumbnailUrl subscriberCount')
      .populate('campaignId', 'name goal budget')
      .populate('brandId', 'name niche tone');

    if (!negotiation) {
      res.status(404).json({ error: 'Not Found', message: 'Negotiation not found' });
      return;
    }

    // Verify ownership
    const brand = await Brand.findOne({ _id: negotiation.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    res.json({ negotiation });
  } catch (error) {
    console.error('Get negotiation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch negotiation' });
  }
});

// POST /api/negotiations/:id/counter — Creator sends counter-offer (simulated), AI responds
router.post('/:id/counter', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      res.status(404).json({ error: 'Not Found', message: 'Negotiation not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: negotiation.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    if (negotiation.status === 'needs_human') {
      res.status(400).json({ error: 'Bad Request', message: 'This ask is above the ceiling. A person on the brand has to accept the ceiling or decline.' });
      return;
    }

    if (negotiation.status !== 'in_progress') {
      res.status(400).json({ error: 'Bad Request', message: 'Negotiation is not active' });
      return;
    }

    if (negotiation.currentRound >= negotiation.maxRounds) {
      res.status(400).json({ error: 'Bad Request', message: 'Maximum negotiation rounds reached' });
      return;
    }

    const { counterRate, message } = req.body;
    if (!counterRate || counterRate < 0 || counterRate > 100) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid counter rate' });
      return;
    }

    // Add creator's counter-offer
    negotiation.messages.push({
      role: 'creator',
      message: message || `I'd like to propose a ${counterRate}% commission rate.`,
      proposedRate: counterRate,
      timestamp: new Date(),
    });

    const creator = await Creator.findById(negotiation.creatorId);
    const aboveMax = counterRate > negotiation.commissionMax;

    if (aboveMax) {
      negotiation.status = 'needs_human';
      negotiation.messages.push({
        role: 'ai_agent',
        message: `${counterRate}% is above the brand ceiling of ${negotiation.commissionMax}%. I have stopped. A person can offer the ceiling (${negotiation.commissionMax}%) or decline. I will not go higher.`,
        proposedRate: negotiation.currentOffer,
        timestamp: new Date(),
      });
      await negotiation.save();
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'needs_human',
        message: `${creator?.channelTitle || 'Creator'} asked for ${counterRate}%. That is above ${negotiation.commissionMax}%, so the agent stopped and asked a human.`,
        meta: { negotiationId: negotiation._id.toString(), counterRate },
      });
      res.json({
        aboveMax: true,
        needsHuman: true,
        message: 'Stopped for a human decision',
        negotiation,
      });
      return;
    }

    // Generate AI response
    const aiResponse = await generateNegotiationResponse(
      negotiation,
      creator?.channelTitle || 'Creator',
      brand.name,
      counterRate
    );

    negotiation.messages.push({
      role: 'ai_agent',
      message: aiResponse.message,
      proposedRate: aiResponse.proposedRate,
      timestamp: new Date(),
    });

    negotiation.currentOffer = aiResponse.proposedRate;
    negotiation.currentRound += 1;

    let deliverable = null;

    if (aiResponse.shouldAccept && counterRate >= negotiation.commissionMin) {
      negotiation.status = 'agreed';
      negotiation.finalRate = counterRate;
      negotiation.messages.push({
        role: 'ai_agent',
        message: `Great news! We've agreed on a ${counterRate}% commission rate. Looking forward to a successful partnership!`,
        proposedRate: counterRate,
        timestamp: new Date(),
      });
    }

    await negotiation.save();

    if (negotiation.status === 'agreed') {
      deliverable = await closeAgreedDeal(negotiation, creator?.channelTitle || 'Creator', creator?.platform, req.user!.userId);
    } else {
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'negotiate',
        message: `${creator?.channelTitle || 'Creator'} asked for ${counterRate}%. Agent countered at ${aiResponse.proposedRate}% (round ${negotiation.currentRound} of ${negotiation.maxRounds}).`,
        meta: {
          negotiationId: negotiation._id.toString(),
          counterRate,
          proposedRate: aiResponse.proposedRate,
          aboveMax,
        },
      });
    }

    res.json({
      aboveMax,
      deliverable,
      message: negotiation.status === 'agreed' ? 'Negotiation agreed!' : 'Counter-offer processed',
      negotiation,
      aiResponse,
    });
  } catch (error: any) {
    console.error('Counter-offer error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to process counter-offer' });
  }
});

// POST /api/negotiations/:id/decide — human answers when the creator asked above the ceiling
router.post('/:id/decide', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      res.status(404).json({ error: 'Not Found', message: 'Negotiation not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: negotiation.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    if (negotiation.status !== 'needs_human') {
      res.status(400).json({ error: 'Bad Request', message: 'This negotiation is not waiting for a person' });
      return;
    }

    const decision = req.body.decision as string;
    const creator = await Creator.findById(negotiation.creatorId);

    if (decision === 'decline') {
      negotiation.status = 'rejected';
      negotiation.messages.push({
        role: 'brand',
        message: `We can't go above ${negotiation.commissionMax}%, so we'll pass on this partnership.`,
        timestamp: new Date(),
      });
      await negotiation.save();
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'human_decision',
        message: `Declined ${creator?.channelTitle || 'a creator'} after they asked above ${negotiation.commissionMax}%.`,
        meta: { negotiationId: negotiation._id.toString() },
      });
      res.json({ message: 'Declined', negotiation });
      return;
    }

    if (decision === 'offer_ceiling') {
      negotiation.status = 'in_progress';
      negotiation.currentOffer = negotiation.commissionMax;
      negotiation.currentRound += 1;
      negotiation.messages.push({
        role: 'brand',
        message: `Our highest commission is ${negotiation.commissionMax}%. We can do that, and we can't go higher.`,
        proposedRate: negotiation.commissionMax,
        timestamp: new Date(),
      });
      await negotiation.save();
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'human_decision',
        message: `Held the ceiling at ${negotiation.commissionMax}% for ${creator?.channelTitle || 'a creator'}.`,
        meta: { negotiationId: negotiation._id.toString() },
      });
      res.json({ message: `Offer set to the ceiling of ${negotiation.commissionMax}%`, negotiation });
      return;
    }

    res.status(400).json({ error: 'Bad Request', message: 'Decision must be "decline" or "offer_ceiling"' });
  } catch (error) {
    console.error('Human decision error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not record the decision' });
  }
});

// POST /api/negotiations/:id/accept — Accept current terms
router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      res.status(404).json({ error: 'Not Found', message: 'Negotiation not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: negotiation.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    if (negotiation.currentOffer > negotiation.commissionMax || negotiation.currentOffer < negotiation.commissionMin) {
      res.status(400).json({ error: 'Bad Request', message: 'Current offer is outside the commission guardrails' });
      return;
    }

    negotiation.status = 'agreed';
    negotiation.finalRate = negotiation.currentOffer;
    negotiation.messages.push({
      role: 'brand',
      message: `We've accepted the ${negotiation.currentOffer}% commission rate. Let's proceed!`,
      proposedRate: negotiation.currentOffer,
      timestamp: new Date(),
    });
    await negotiation.save();

    const creator = await Creator.findById(negotiation.creatorId);
    const deliverable = await closeAgreedDeal(
      negotiation,
      creator?.channelTitle || 'Creator',
      creator?.platform,
      req.user!.userId
    );

    res.json({ message: 'Negotiation accepted', negotiation, deliverable });
  } catch (error) {
    console.error('Accept negotiation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to accept negotiation' });
  }
});

// POST /api/negotiations/:id/reject — Reject negotiation
router.post('/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      res.status(404).json({ error: 'Not Found', message: 'Negotiation not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: negotiation.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    negotiation.status = 'rejected';
    negotiation.messages.push({
      role: 'brand',
      message: req.body.reason || 'We\'ve decided not to proceed with this negotiation at this time. Thank you for your interest.',
      timestamp: new Date(),
    });
    await negotiation.save();

    res.json({ message: 'Negotiation rejected', negotiation });
  } catch (error) {
    console.error('Reject negotiation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject negotiation' });
  }
});

export default router;

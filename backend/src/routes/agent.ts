import { Router, Response } from 'express';
import { Brand } from '../models/Brand';
import { Campaign } from '../models/Campaign';
import { Brief } from '../models/Brief';
import { Creator } from '../models/Creator';
import { Negotiation } from '../models/Negotiation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { parseBrief } from '../services/briefParser';
import { logActivity } from '../services/activityLog';
import { interpretCreatorReply } from '../services/replyAgent';
import { addCreatorToActiveCampaign, closeAgreedDeal } from '../services/pipeline';

const router = Router();

// POST /api/agent/brief — turn one sentence into a YouTube search plus commission guardrails
router.post('/brief', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, prompt } = req.body as { brandId?: string; prompt?: string };
    if (!brandId || !prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Choose a brand and type the instruction.' });
      return;
    }

    const brand = await Brand.findOne({ _id: brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    let parsed;
    try {
      parsed = parseBrief(prompt);
    } catch (error: any) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
      return;
    }

    if (parsed.platform !== 'youtube') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'This version searches YouTube only. Instagram and TikTok come later.',
      });
      return;
    }

    brand.niche = parsed.niche;
    brand.minAudienceSize = parsed.minFollowers;
    brand.maxAudienceSize = parsed.maxFollowers;
    if (!brand.targetAudience || brand.targetAudience.length < 3) {
      brand.targetAudience = `${parsed.niche} audience`;
    }
    await brand.save();

    let campaign = await Campaign.findOne({ userId: req.user!.userId, brandId: brand._id, status: 'active' }).sort({ createdAt: -1 });
    if (!campaign) {
      campaign = await Campaign.create({
        userId: req.user!.userId,
        brandId: brand._id,
        name: `${parsed.niche} affiliates`,
        goal: prompt.trim(),
        budget: 1500,
        targetDemographic: brand.targetAudience,
        commissionMin: parsed.commissionMin,
        commissionMax: parsed.commissionMax,
        status: 'active',
      });
    } else {
      campaign.commissionMin = parsed.commissionMin;
      campaign.commissionMax = parsed.commissionMax;
      campaign.goal = prompt.trim();
      await campaign.save();
    }

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'brief',
      message: `Read the brief: find ${parsed.niche} creators on ${parsed.platform} with ${parsed.minFollowers.toLocaleString()}–${parsed.maxFollowers.toLocaleString()} followers, commission ${parsed.commissionMin}–${parsed.commissionMax}%.`,
      meta: { campaignId: campaign._id.toString(), ...parsed },
    });

    res.json({
      message: 'Brief applied. Search YouTube next.',
      parsed,
      brand,
      campaign,
      search: {
        query: parsed.niche,
        platforms: ['youtube'],
        maxResults: 50,
        minAudienceSize: parsed.minFollowers,
        maxAudienceSize: parsed.maxFollowers,
      },
    });
  } catch (error) {
    console.error('Agent brief error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not read that instruction' });
  }
});

// GET /api/agent/briefs?brandId= — saved instructions for one brand
router.get('/briefs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.query.brandId as string | undefined;
    if (!brandId) {
      res.status(400).json({ error: 'Bad Request', message: 'Choose a brand.' });
      return;
    }
    const brand = await Brand.findOne({ _id: brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    const briefs = await Brief.find({ userId: req.user!.userId, brandId: brand._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ briefs });
  } catch (error) {
    console.error('List briefs error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not load saved searches' });
  }
});

// GET /api/agent/briefs/:id — reopen one saved search
router.get('/briefs/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brief = await Brief.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!brief) {
      res.status(404).json({ error: 'Not Found', message: 'Saved search not found' });
      return;
    }
    const creators = await Creator.find({ _id: { $in: brief.creatorIds } }).sort({ fitScore: -1 });
    res.json({ brief, creators });
  } catch (error) {
    console.error('Get brief error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not open that search' });
  }
});

// POST /api/agent/reply — read a pasted creator reply and stay inside the commission ceiling
router.post('/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, creatorId, message } = req.body as { brandId?: string; creatorId?: string; message?: string };
    if (!brandId || !creatorId || !message || !message.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Paste the creator reply first.' });
      return;
    }

    const brand = await Brand.findOne({ _id: brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    const creator = await Creator.findOne({ _id: creatorId, brandId: brand._id });
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    const campaign = await Campaign.findOne({ userId: req.user!.userId, brandId: brand._id, status: 'active' }).sort({ createdAt: -1 });
    if (!campaign) {
      res.status(400).json({ error: 'Bad Request', message: 'Run a search first so the brand has an active campaign.' });
      return;
    }

    await addCreatorToActiveCampaign(req.user!.userId, brand._id, creator._id);
    const freshCampaign = await Campaign.findById(campaign._id);
    if (!freshCampaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    let negotiation = await Negotiation.findOne({
      campaignId: freshCampaign._id,
      creatorId: creator._id,
      status: { $in: ['pending', 'in_progress', 'needs_human'] },
    });

    if (negotiation?.status === 'needs_human') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'This reply is already waiting for a person. Offer the ceiling or decline on the campaign page.',
      });
      return;
    }

    if (!negotiation) {
      negotiation = await Negotiation.create({
        campaignId: freshCampaign._id,
        brandId: brand._id,
        creatorId: creator._id,
        commissionMin: freshCampaign.commissionMin,
        commissionMax: freshCampaign.commissionMax,
        currentOffer: freshCampaign.commissionMin,
        currentRound: 1,
        status: 'in_progress',
        messages: [{
          role: 'ai_agent',
          message: `Opening offer is ${freshCampaign.commissionMin}% of each sale. We will not go above ${freshCampaign.commissionMax}%.`,
          proposedRate: freshCampaign.commissionMin,
          timestamp: new Date(),
        }],
      });
    }

    const decision = interpretCreatorReply({
      message: message.trim(),
      commissionMin: negotiation.commissionMin,
      commissionMax: negotiation.commissionMax,
      brandName: brand.name,
      productPrice: brand.productPrice || 25,
    });

    negotiation.messages.push({
      role: 'creator',
      message: message.trim(),
      proposedRate: decision.askedRate,
      timestamp: new Date(),
    });
    negotiation.messages.push({
      role: 'ai_agent',
      message: decision.answer,
      proposedRate: decision.proposedRate,
      timestamp: new Date(),
    });

    const entry = freshCampaign.creators.find((item) => item.creatorId.toString() === creator._id.toString());
    if (entry && entry.stage === 'discovered') {
      entry.stage = 'responded';
      entry.movedAt = new Date();
    }

    if (decision.kind === 'above') {
      negotiation.status = 'needs_human';
      if (entry) {
        entry.stage = 'negotiating';
        entry.movedAt = new Date();
      }
      await freshCampaign.save();
      await negotiation.save();
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'needs_human',
        message: `${creator.channelTitle} asked for ${decision.askedRate}%. That is above ${negotiation.commissionMax}%, so the agent stopped.`,
        meta: { negotiationId: negotiation._id.toString(), askedRate: decision.askedRate },
      });
      res.json({ decision: decision.kind, answer: decision.answer, negotiation, needsHuman: true });
      return;
    }

    if (decision.kind === 'agree') {
      negotiation.status = 'agreed';
      negotiation.finalRate = decision.proposedRate;
      negotiation.currentOffer = decision.proposedRate;
      await negotiation.save();
      const deliverable = await closeAgreedDeal(negotiation, creator.channelTitle, creator.platform, req.user!.userId);
      res.json({ decision: decision.kind, answer: decision.answer, negotiation, deliverable });
      return;
    }

    negotiation.currentOffer = decision.proposedRate;
    negotiation.currentRound += 1;
    negotiation.status = 'in_progress';
    if (entry && (entry.stage === 'discovered' || entry.stage === 'contacted' || entry.stage === 'responded')) {
      entry.stage = 'negotiating';
      entry.movedAt = new Date();
    }
    await freshCampaign.save();
    await negotiation.save();
    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'negotiate',
      message: `Replied to ${creator.channelTitle}: ${decision.answer}`,
      meta: { negotiationId: negotiation._id.toString(), kind: decision.kind },
    });
    res.json({ decision: decision.kind, answer: decision.answer, negotiation });
  } catch (error) {
    console.error('Creator reply error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Could not answer that reply' });
  }
});

export default router;

import { Router, Response } from 'express';
import { Deliverable } from '../models/Deliverable';
import { Campaign } from '../models/Campaign';
import { Brand } from '../models/Brand';
import { Creator } from '../models/Creator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activityLog';

const router = Router();

// POST /api/deliverables — Create deliverable
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, creatorId, type, title, linkUrl, dueDate, notes } = req.body;

    const campaign = await Campaign.findOne({ _id: campaignId, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const creator = await Creator.findById(creatorId);
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    // Generate tracking URL
    const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trackingUrl = `https://track.influenceai.io/${trackingId}`;

    const deliverable = await Deliverable.create({
      campaignId,
      brandId: campaign.brandId,
      creatorId,
      type,
      title,
      linkUrl: linkUrl || '',
      trackingUrl,
      dueDate: new Date(dueDate),
      notes: notes || '',
    });

    res.status(201).json({ message: 'Deliverable created', deliverable });
  } catch (error) {
    console.error('Create deliverable error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create deliverable' });
  }
});

// GET /api/deliverables/campaign/:campaignId — List deliverables for a campaign
router.get('/campaign/:campaignId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user!.userId });
    if (!campaign) {
      res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
      return;
    }

    const deliverables = await Deliverable.find({ campaignId: campaign._id })
      .populate('creatorId', 'channelTitle channelId platform thumbnailUrl')
      .sort({ dueDate: 1 });

    res.json({ deliverables });
  } catch (error) {
    console.error('List deliverables error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch deliverables' });
  }
});

// GET /api/deliverables/brand/:brandId — List all deliverables for a brand
router.get('/brand/:brandId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const deliverables = await Deliverable.find({ brandId: brand._id })
      .populate('creatorId', 'channelTitle channelId platform thumbnailUrl')
      .populate('campaignId', 'name')
      .sort({ dueDate: 1 });

    res.json({ deliverables });
  } catch (error) {
    console.error('List brand deliverables error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch deliverables' });
  }
});

// PATCH /api/deliverables/:id — Update deliverable (status, link, metrics)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    // Verify ownership
    const brand = await Brand.findOne({ _id: deliverable.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    const { status, linkUrl, metrics, notes, title } = req.body;
    const wasLive = deliverable.status === 'live';

    if (linkUrl !== undefined) deliverable.linkUrl = linkUrl;

    if (status) {
      const validStatuses = ['pending', 'submitted', 'approved', 'revision_needed', 'live', 'expired'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid status' });
        return;
      }
      if (status === 'live' && !deliverable.linkUrl) {
        res.status(400).json({ error: 'Bad Request', message: 'Paste the live post link before marking this deliverable live' });
        return;
      }
      deliverable.status = status;
      if (status === 'submitted') deliverable.submittedAt = new Date();
      if (status === 'approved') deliverable.approvedAt = new Date();
    }
    if (title) deliverable.title = title;
    if (notes !== undefined) deliverable.notes = notes;
    if (metrics) {
      if (metrics.views !== undefined) deliverable.metrics.views = metrics.views;
      if (metrics.likes !== undefined) deliverable.metrics.likes = metrics.likes;
      if (metrics.comments !== undefined) deliverable.metrics.comments = metrics.comments;
      if (metrics.clicks !== undefined) deliverable.metrics.clicks = metrics.clicks;
      if (metrics.conversions !== undefined) deliverable.metrics.conversions = metrics.conversions;
    }

    await deliverable.save();

    if (!wasLive && deliverable.status === 'live' && deliverable.linkUrl) {
      const creator = await Creator.findById(deliverable.creatorId);
      await logActivity({
        userId: req.user!.userId,
        brandId: deliverable.brandId,
        action: 'deliverable',
        message: `Saved the live link for ${creator?.channelTitle || 'a creator'}: ${deliverable.linkUrl}`,
        meta: { deliverableId: deliverable._id.toString(), linkUrl: deliverable.linkUrl },
      });
    }

    res.json({ message: 'Deliverable updated', deliverable });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update deliverable' });
  }
});

// DELETE /api/deliverables/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: deliverable.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    await Deliverable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deliverable deleted' });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete deliverable' });
  }
});

export default router;

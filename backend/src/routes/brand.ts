import { Router, Response } from 'express';
import { z } from 'zod';
import { Brand } from '../models/Brand';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logActivity } from '../services/activityLog';

const router = Router();

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  niche: z.string().min(1, 'Niche is required').max(200),
  targetAudience: z.string().min(1, 'Target audience is required').max(500),
  regions: z.array(z.string()).min(1, 'At least one region is required'),
  tone: z.string().min(1, 'Tone is required').max(100),
  minAudienceSize: z.number().int().min(0, 'Minimum audience size must be non-negative'),
  maxAudienceSize: z.number().int().min(0).optional(),
  productPrice: z.number().min(1).max(10000).optional(),
});

const brandUpdateSchema = brandSchema.partial();

// POST /api/brands — Create brand
router.post('/', authMiddleware, validate(brandSchema), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.create({
      ...req.body,
      userId: req.user!.userId,
    });
    res.status(201).json({ message: 'Brand created', brand });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create brand' });
  }
});

// GET /api/brands — List user's brands
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brands = await Brand.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ brands });
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch brands' });
  }
});

// GET /api/brands/:id — Get single brand
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    res.json({ brand });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch brand' });
  }
});

// PUT /api/brands/:id — Update brand
router.put('/:id', authMiddleware, validate(brandUpdateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    res.json({ message: 'Brand updated', brand });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update brand' });
  }
});

// DELETE /api/brands/:id — Delete brand
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete brand' });
  }
});

// ─── BRAND SAFETY: CREATOR DO-NOT-CONTACT & COMPETITOR BLACKLIST ───

// GET /api/brands/:id/blacklist — List blacklisted creators
router.get('/:id/blacklist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }
    res.json({ blacklist: brand.blacklist || [] });
  } catch (error) {
    console.error('Get blacklist error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch blacklist' });
  }
});

// POST /api/brands/:id/blacklist — Add creator to blacklist
router.post('/:id/blacklist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const { channelTitle, channelId, platform, reason, notes } = req.body;
    if (!channelTitle || !channelTitle.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Creator channel title or handle is required' });
      return;
    }

    // Check if already blacklisted
    const existing = brand.blacklist.find(
      (b) => b.channelTitle.toLowerCase() === channelTitle.trim().toLowerCase()
    );
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Creator is already in the blacklist' });
      return;
    }

    const newEntry = {
      channelTitle: channelTitle.trim(),
      channelId: channelId || '',
      platform: platform || 'youtube',
      reason: reason || 'competitor',
      notes: notes || '',
      addedAt: new Date(),
    };

    brand.blacklist.push(newEntry as any);
    await brand.save();

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'blacklist',
      message: `Added creator "${channelTitle}" to the Brand Safety Blacklist (${reason || 'competitor'}).`,
      meta: { channelTitle, reason },
    });

    res.status(201).json({
      message: 'Creator added to blacklist',
      blacklist: brand.blacklist,
    });
  } catch (error) {
    console.error('Add blacklist error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add creator to blacklist' });
  }
});

// DELETE /api/brands/:id/blacklist/:entryId — Remove creator from blacklist
router.delete('/:id/blacklist/:entryId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const entryId = req.params.entryId;
    const initialCount = brand.blacklist.length;

    brand.blacklist = brand.blacklist.filter(
      (entry: any) => entry._id?.toString() !== entryId && entry.channelTitle !== entryId
    );

    if (brand.blacklist.length === initialCount) {
      res.status(404).json({ error: 'Not Found', message: 'Blacklist entry not found' });
      return;
    }

    await brand.save();

    await logActivity({
      userId: req.user!.userId,
      brandId: brand._id,
      action: 'whitelist',
      message: `Removed creator from Brand Safety Blacklist.`,
      meta: { entryId },
    });

    res.json({ message: 'Creator removed from blacklist', blacklist: brand.blacklist });
  } catch (error) {
    console.error('Remove blacklist error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to remove creator from blacklist' });
  }
});

export default router;

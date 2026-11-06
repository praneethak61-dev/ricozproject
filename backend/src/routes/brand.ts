import { Router, Response } from 'express';
import { z } from 'zod';
import { Brand } from '../models/Brand';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

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

export default router;

import { Router, Response } from 'express';
import { Activity } from '../models/Activity';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activity — recent agent actions for the signed-in user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const events = await Activity.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('brandId', 'name');

    res.json({ events });
  } catch (error) {
    console.error('List activity error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch activity' });
  }
});

export default router;

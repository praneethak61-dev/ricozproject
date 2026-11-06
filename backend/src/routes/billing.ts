import { Router, Response } from 'express';
import { Activity } from '../models/Activity';
import { Brand } from '../models/Brand';
import { Outreach } from '../models/Outreach';
import { Negotiation } from '../models/Negotiation';
import { Deliverable } from '../models/Deliverable';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const PLAN = {
  name: 'D2C Agent',
  priceMonthly: 1500,
  currency: 'USD',
  status: 'active' as const,
  audience: 'D2C e-commerce brands',
  includes: [
    'YouTube search for micro-influencers in the brand niche',
    'A ranked list the brand approves before anyone is emailed',
    'A separate personalized email for each approved creator',
    'Commission guardrails the agent cannot break',
    'Negotiation and post tracking, added with the rest of the product',
  ],
};

// GET /api/billing — flat monthly plan and this month's usage
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const brands = await Brand.find({ userId });
    const brandIds = brands.map((b) => b._id);

    const [searches, emailsSent, dealsClosed, deliverablesLive] = await Promise.all([
      Activity.countDocuments({ userId, action: 'search', createdAt: { $gte: periodStart } }),
      Outreach.countDocuments({ brandId: { $in: brandIds }, status: 'sent', updatedAt: { $gte: periodStart } }),
      Negotiation.countDocuments({ brandId: { $in: brandIds }, status: 'agreed', updatedAt: { $gte: periodStart } }),
      Deliverable.countDocuments({ brandId: { $in: brandIds }, status: 'live', updatedAt: { $gte: periodStart } }),
    ]);

    res.json({
      plan: PLAN,
      usage: {
        periodStart: periodStart.toISOString(),
        searches,
        emailsSent,
        dealsClosed,
        deliverablesLive,
      },
    });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch plan' });
  }
});

export default router;

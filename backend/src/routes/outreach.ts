import { Router, Response } from 'express';
import nodemailer from 'nodemailer';
import { Brand } from '../models/Brand';
import { Campaign } from '../models/Campaign';
import { Creator } from '../models/Creator';
import { Outreach, DNC } from '../models/Outreach';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateOutreachEmail } from '../services/emailGenerator';
import { env } from '../config/env';
import { logActivity } from '../services/activityLog';
import { advanceCreatorStage } from '../services/pipeline';

const router = Router();

// Create transporter — if SMTP is not configured, emails are logged to console
function createTransporter() {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return null;
}

// POST /api/outreach/:brandId/generate — generate email drafts for approved creators
router.post('/:brandId/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const approvedCreators = await Creator.find({
      brandId: brand._id,
      status: 'approved',
    });

    if (approvedCreators.length === 0) {
      res.json({ message: 'No approved creators to generate outreach for', outreach: [] });
      return;
    }

    // Check DNC list
    const dncEmails = await DNC.find({}).select('email');
    const dncSet = new Set(dncEmails.map((d) => d.email.toLowerCase()));

    const campaign = await Campaign.findOne({
      userId: req.user!.userId,
      brandId: brand._id,
      status: 'active',
    }).sort({ createdAt: -1 });
    const offer = campaign
      ? { commissionMin: campaign.commissionMin, commissionMax: campaign.commissionMax }
      : undefined;

    const outreachList = [];

    for (const creator of approvedCreators) {
      // Skip if on DNC list
      if (creator.contactEmail && dncSet.has(creator.contactEmail.toLowerCase())) {
        continue;
      }

      // Skip if outreach already exists for this creator-brand pair
      const existingOutreach = await Outreach.findOne({
        brandId: brand._id,
        creatorId: creator._id,
      });
      if (existingOutreach) continue;

      // Generate email using LLM
      const { subject, body } = await generateOutreachEmail(brand, creator, false, offer);

      const outreach = await Outreach.create({
        brandId: brand._id,
        creatorId: creator._id,
        recipientEmail: env.TEST_EMAIL, // Always send to test email
        subject,
        body,
        status: 'draft',
        isTestEmail: true,
      });

      outreachList.push(outreach);
    }

    if (outreachList.length > 0) {
      await logActivity({
        userId: req.user!.userId,
        brandId: brand._id,
        action: 'outreach',
        message: `Drafted ${outreachList.length} first-touch email${outreachList.length === 1 ? '' : 's'} for ${brand.name}.`,
        meta: { count: outreachList.length },
      });
    }

    res.json({
      message: `Generated ${outreachList.length} outreach emails`,
      outreach: outreachList,
    });
  } catch (error: any) {
    console.error('Generate outreach error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to generate outreach' });
  }
});

// GET /api/outreach/:brandId — list outreach entries
router.get('/:brandId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(404).json({ error: 'Not Found', message: 'Brand not found' });
      return;
    }

    const outreach = await Outreach.find({ brandId: brand._id })
      .populate('creatorId', 'channelTitle channelId fitScore')
      .sort({ createdAt: -1 });
    res.json({ outreach });
  } catch (error) {
    console.error('List outreach error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch outreach' });
  }
});

// POST /api/outreach/:id/send — send to test email only
router.post('/:id/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const outreach = await Outreach.findById(req.params.id);
    if (!outreach) {
      res.status(404).json({ error: 'Not Found', message: 'Outreach not found' });
      return;
    }

    // Verify ownership
    const brand = await Brand.findOne({ _id: outreach.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    const transporter = createTransporter();

    if (transporter) {
      await transporter.sendMail({
        from: `"${env.SENDER_NAME}" <${env.SENDER_EMAIL}>`,
        to: env.TEST_EMAIL,
        subject: outreach.subject,
        text: outreach.body,
      });
      outreach.status = 'sent';
    } else {
      // No SMTP configured — log to console
      console.log('📧 Email would be sent:');
      console.log(`   To: ${env.TEST_EMAIL}`);
      console.log(`   Subject: ${outreach.subject}`);
      console.log(`   Body: ${outreach.body.substring(0, 200)}...`);
      outreach.status = 'sent'; // Mark as sent even in console mode
    }

    await outreach.save();

    const creator = await Creator.findById(outreach.creatorId);
    await advanceCreatorStage(outreach.brandId, outreach.creatorId, 'contacted');
    await logActivity({
      userId: req.user!.userId,
      brandId: outreach.brandId,
      action: 'email_sent',
      message: `Sent the first email for ${creator?.channelTitle || 'a creator'} to the test inbox and moved them to Contacted.`,
      meta: { outreachId: outreach._id.toString(), creatorId: String(outreach.creatorId) },
    });

    res.json({ message: 'Email sent (to test address)', outreach });
  } catch (error: any) {
    console.error('Send email error:', error);
    // Update status to failed
    try {
      await Outreach.findByIdAndUpdate(req.params.id, { status: 'failed' });
    } catch {}
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to send email' });
  }
});

// POST /api/outreach/:id/followup — generate & queue follow-up
router.post('/:id/followup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const outreach = await Outreach.findById(req.params.id).populate('creatorId');
    if (!outreach) {
      res.status(404).json({ error: 'Not Found', message: 'Outreach not found' });
      return;
    }

    const brand = await Brand.findOne({ _id: outreach.brandId, userId: req.user!.userId });
    if (!brand) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
      return;
    }

    if (outreach.followUpCount >= outreach.maxFollowUps) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Follow-up cap reached (${outreach.maxFollowUps} max)`,
      });
      return;
    }

    const creator = await Creator.findById(outreach.creatorId);
    if (!creator) {
      res.status(404).json({ error: 'Not Found', message: 'Creator not found' });
      return;
    }

    // Generate follow-up email
    const { subject, body } = await generateOutreachEmail(brand, creator, true);

    outreach.subject = subject;
    outreach.body = body;
    outreach.followUpCount += 1;
    outreach.status = 'draft';
    await outreach.save();

    res.json({ message: 'Follow-up generated', outreach });
  } catch (error: any) {
    console.error('Follow-up error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to generate follow-up' });
  }
});

// POST /api/outreach/dnc/add — add to do-not-contact list
router.post('/dnc/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email, reason } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Bad Request', message: 'Email is required' });
      return;
    }

    const existing = await DNC.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.json({ message: 'Email already on DNC list' });
      return;
    }

    const dnc = await DNC.create({
      email: email.toLowerCase(),
      reason: reason || 'User requested',
      addedBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Added to do-not-contact list', dnc });
  } catch (error) {
    console.error('DNC add error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add to DNC list' });
  }
});

// GET /api/outreach/dnc/list — list DNC entries
router.get('/dnc/list', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const dncList = await DNC.find({}).sort({ createdAt: -1 });
    res.json({ dncList });
  } catch (error) {
    console.error('DNC list error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch DNC list' });
  }
});

export default router;

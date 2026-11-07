import { Types } from 'mongoose';
import { Campaign, PipelineStage } from '../models/Campaign';
import { Deliverable, DeliverableType } from '../models/Deliverable';
import { logActivity } from './activityLog';

const STAGE_ORDER: PipelineStage[] = ['discovered', 'contacted', 'responded', 'negotiating', 'contracted'];

export async function addCreatorToActiveCampaign(
  userId: string,
  brandId: unknown,
  creatorId: unknown
) {
  const campaign = await Campaign.findOne({ userId, brandId, status: 'active' }).sort({ createdAt: -1 });
  if (!campaign) return null;

  const id = String(creatorId);
  const existing = campaign.creators.find((c) => c.creatorId.toString() === id);
  if (existing) return campaign;

  campaign.creators.push({
    creatorId: creatorId as never,
    stage: 'discovered',
    movedAt: new Date(),
  });
  await campaign.save();
  return campaign;
}

export async function advanceCreatorStage(
  brandId: unknown,
  creatorId: unknown,
  stage: PipelineStage,
  extra?: { commissionRate?: number; agreedTerms?: string }
) {
  const campaigns = await Campaign.find({ brandId, status: { $in: ['active', 'paused'] } });
  const id = String(creatorId);
  const targetRank = STAGE_ORDER.indexOf(stage);

  for (const campaign of campaigns) {
    const entry = campaign.creators.find((c) => c.creatorId.toString() === id);
    if (!entry) continue;
    const currentRank = STAGE_ORDER.indexOf(entry.stage);
    if (currentRank >= targetRank) continue;
    entry.stage = stage;
    entry.movedAt = new Date();
    if (extra?.commissionRate !== undefined) entry.commissionRate = extra.commissionRate;
    if (extra?.agreedTerms) entry.agreedTerms = extra.agreedTerms;
    await campaign.save();
  }
}

function deliverableTypeForPlatform(platform?: string): DeliverableType {
  if (platform === 'instagram') return 'instagram_reel';
  if (platform === 'tiktok') return 'tiktok_video';
  return 'youtube_video';
}

export async function ensureDeliverable(params: {
  campaignId: unknown;
  brandId: unknown;
  creatorId: unknown;
  creatorName: string;
  platform?: string;
  rate: number;
}) {
  const existing = await Deliverable.findOne({
    campaignId: params.campaignId,
    creatorId: params.creatorId,
  });
  if (existing) return existing;

  const trackingId = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return Deliverable.create({
    campaignId: params.campaignId,
    brandId: params.brandId,
    creatorId: params.creatorId,
    type: deliverableTypeForPlatform(params.platform),
    title: `${params.creatorName} — campaign post`,
    linkUrl: '',
    trackingUrl: `https://track.influenceai.io/${trackingId}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    notes: `Agreed commission ${params.rate}%`,
    status: 'pending',
  });
}

export async function closeAgreedDeal(
  negotiation: {
    _id: { toString(): string };
    finalRate?: number;
    currentOffer: number;
    campaignId: unknown;
    brandId: string | Types.ObjectId;
    creatorId: unknown;
  },
  creatorName: string,
  platform: string | undefined,
  userId: string
) {
  const rate = negotiation.finalRate ?? negotiation.currentOffer;
  const campaign = await Campaign.findById(negotiation.campaignId);
  if (campaign) {
    const creatorEntry = campaign.creators.find(
      (c) => c.creatorId.toString() === String(negotiation.creatorId)
    );
    if (creatorEntry) {
      creatorEntry.stage = 'contracted';
      creatorEntry.commissionRate = rate;
      creatorEntry.agreedTerms = `${rate}% commission`;
      creatorEntry.movedAt = new Date();
      await campaign.save();
    }
  }

  const deliverable = await ensureDeliverable({
    campaignId: negotiation.campaignId,
    brandId: negotiation.brandId,
    creatorId: negotiation.creatorId,
    creatorName,
    platform,
    rate,
  });

  await logActivity({
    userId,
    brandId: negotiation.brandId,
    action: 'deal',
    message: `Agreed ${rate}% with ${creatorName} and opened a deliverable due ${deliverable.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
    meta: { negotiationId: negotiation._id.toString(), deliverableId: deliverable._id.toString(), rate },
  });

  return deliverable;
}

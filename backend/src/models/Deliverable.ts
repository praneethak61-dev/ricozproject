import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeliverableType = 'youtube_video' | 'instagram_post' | 'instagram_reel' | 'instagram_story' | 'tiktok_video' | 'blog_post' | 'other';
export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'revision_needed' | 'live' | 'expired';

export interface IPayout {
  amount: number;
  currency: string;
  status: 'unpaid' | 'processing' | 'paid' | 'failed';
  stripeTransferId?: string;
  stripeReceiptUrl?: string;
  paidAt?: Date;
}

export interface ISocialListening {
  lastScannedAt?: Date;
  views: number;
  likes: number;
  comments: number;
  clicks: number;
  conversions: number;
  cpv: number; // Cost Per View
  cpc: number; // Cost Per Click
  emv: number; // Earned Media Value
  sentimentRatio: number; // Percentage positive
  status: 'live_active' | 'analyzing' | 'flagged' | 'offline';
}

export interface IDeliverable extends Document {
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  type: DeliverableType;
  title: string;
  linkUrl: string;
  trackingUrl: string;
  status: DeliverableStatus;
  dueDate: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  budget?: number;
  payout?: IPayout;
  socialListening?: ISocialListening;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    clicks?: number;
    conversions?: number;
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['unpaid', 'processing', 'paid', 'failed'],
      default: 'unpaid',
    },
    stripeTransferId: { type: String, default: '' },
    stripeReceiptUrl: { type: String, default: '' },
    paidAt: { type: Date },
  },
  { _id: false }
);

const SocialListeningSchema = new Schema<ISocialListening>(
  {
    lastScannedAt: { type: Date },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    cpv: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    emv: { type: Number, default: 0 },
    sentimentRatio: { type: Number, default: 95 },
    status: {
      type: String,
      enum: ['live_active', 'analyzing', 'flagged', 'offline'],
      default: 'live_active',
    },
  },
  { _id: false }
);

const DeliverableSchema = new Schema<IDeliverable>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
    type: {
      type: String,
      enum: ['youtube_video', 'instagram_post', 'instagram_reel', 'instagram_story', 'tiktok_video', 'blog_post', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    linkUrl: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'revision_needed', 'live', 'expired'],
      default: 'pending',
    },
    dueDate: { type: Date, required: true },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    budget: { type: Number, default: 350 },
    payout: { type: PayoutSchema, default: () => ({ amount: 350, currency: 'USD', status: 'unpaid' }) },
    socialListening: {
      type: SocialListeningSchema,
      default: () => ({
        views: 0,
        likes: 0,
        comments: 0,
        clicks: 0,
        conversions: 0,
        cpv: 0,
        cpc: 0,
        emv: 0,
        sentimentRatio: 96,
        status: 'live_active',
      }),
    },
    metrics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Deliverable = mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);

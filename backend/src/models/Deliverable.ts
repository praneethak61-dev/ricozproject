import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeliverableType = 'youtube_video' | 'instagram_post' | 'instagram_reel' | 'instagram_story' | 'tiktok_video' | 'blog_post' | 'other';
export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'revision_needed' | 'live' | 'expired';

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

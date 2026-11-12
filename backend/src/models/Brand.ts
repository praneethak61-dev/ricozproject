import mongoose, { Schema, Document, Types } from 'mongoose';

export type BlacklistReason = 'competitor' | 'controversy' | 'do_not_contact' | 'poor_performance' | 'other';

export interface IBlacklistEntry {
  _id?: Types.ObjectId;
  channelTitle: string;
  channelId?: string;
  platform?: string;
  reason: BlacklistReason;
  notes?: string;
  addedAt: Date;
}

export interface IBrand extends Document {
  userId: Types.ObjectId;
  name: string;
  niche: string;
  targetAudience: string;
  regions: string[];
  tone: string;
  minAudienceSize: number;
  maxAudienceSize: number;
  productPrice: number;
  blacklist: IBlacklistEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const BlacklistEntrySchema = new Schema<IBlacklistEntry>({
  channelTitle: { type: String, required: true, trim: true },
  channelId: { type: String, default: '' },
  platform: { type: String, default: 'youtube' },
  reason: {
    type: String,
    enum: ['competitor', 'controversy', 'do_not_contact', 'poor_performance', 'other'],
    default: 'competitor',
  },
  notes: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
});

const BrandSchema = new Schema<IBrand>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    niche: {
      type: String,
      required: true,
      trim: true,
    },
    targetAudience: {
      type: String,
      required: true,
      trim: true,
    },
    regions: {
      type: [String],
      required: true,
      default: [],
    },
    tone: {
      type: String,
      required: true,
      trim: true,
      default: 'professional',
    },
    minAudienceSize: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
    maxAudienceSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    productPrice: {
      type: Number,
      default: 25,
      min: 1,
    },
    blacklist: {
      type: [BlacklistEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);

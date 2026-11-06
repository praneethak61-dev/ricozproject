import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecentVideo {
  videoId: string;
  title: string;
  publishedAt: Date;
  viewCount?: number;
}

export interface IScoreBreakdown {
  niche: number;
  engagement: number;
  consistency: number;
}

export interface ICreator extends Document {
  brandId: Types.ObjectId;
  platform: 'youtube' | 'instagram' | 'tiktok';
  channelId: string;
  channelTitle: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  contactEmail: string;
  recentVideos: IRecentVideo[];
  fitScore: number;
  fitReason: string;
  scoreBreakdown: IScoreBreakdown;
  engagementRate: number;
  brandSafetyScore: number;
  brandSafetyFlags: string[];
  status: 'pending' | 'approved' | 'rejected';
  sample: boolean;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecentVideoSchema = new Schema<IRecentVideo>(
  {
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    viewCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ScoreBreakdownSchema = new Schema<IScoreBreakdown>(
  {
    niche: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
  },
  { _id: false }
);

const CreatorSchema = new Schema<ICreator>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['youtube', 'instagram', 'tiktok'],
      default: 'youtube',
    },
    channelId: {
      type: String,
      required: true,
    },
    channelTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    recentVideos: {
      type: [RecentVideoSchema],
      default: [],
    },
    fitScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    fitReason: {
      type: String,
      default: '',
    },
    scoreBreakdown: {
      type: ScoreBreakdownSchema,
      default: { niche: 0, engagement: 0, consistency: 0 },
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    brandSafetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    brandSafetyFlags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    sample: {
      type: Boolean,
      default: false,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: { expires: 2592000 }, // TTL: 30 days (in seconds)
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate creators per brand
CreatorSchema.index({ brandId: 1, channelId: 1 }, { unique: true });

export const Creator = mongoose.model<ICreator>('Creator', CreatorSchema);

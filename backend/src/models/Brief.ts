import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrief extends Document {
  userId: Types.ObjectId;
  brandId: Types.ObjectId;
  campaignId?: Types.ObjectId;
  prompt: string;
  niche: string;
  minFollowers: number;
  maxFollowers: number;
  commissionMin: number;
  commissionMax: number;
  creatorCount: number;
  creatorIds: Types.ObjectId[];
  sample: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BriefSchema = new Schema<IBrief>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    prompt: { type: String, required: true },
    niche: { type: String, required: true },
    minFollowers: { type: Number, required: true },
    maxFollowers: { type: Number, required: true },
    commissionMin: { type: Number, required: true },
    commissionMax: { type: Number, required: true },
    creatorCount: { type: Number, required: true, default: 0 },
    creatorIds: { type: [Schema.Types.ObjectId], ref: 'Creator', default: [] },
    sample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Brief = mongoose.model<IBrief>('Brief', BriefSchema);

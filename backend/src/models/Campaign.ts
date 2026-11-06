import mongoose, { Schema, Document, Types } from 'mongoose';

export type PipelineStage = 'discovered' | 'contacted' | 'responded' | 'negotiating' | 'contracted';

export interface ICampaignCreator {
  creatorId: Types.ObjectId;
  stage: PipelineStage;
  commissionRate?: number;
  agreedTerms?: string;
  movedAt: Date;
}

export interface ICampaign extends Document {
  userId: Types.ObjectId;
  brandId: Types.ObjectId;
  name: string;
  goal: string;
  budget: number;
  targetDemographic: string;
  commissionMin: number;
  commissionMax: number;
  status: 'active' | 'paused' | 'completed';
  creators: ICampaignCreator[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignCreatorSchema = new Schema<ICampaignCreator>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
    stage: {
      type: String,
      enum: ['discovered', 'contacted', 'responded', 'negotiating', 'contracted'],
      default: 'discovered',
    },
    commissionRate: { type: Number, min: 0, max: 100 },
    agreedTerms: { type: String, default: '' },
    movedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    targetDemographic: { type: String, required: true, trim: true },
    commissionMin: { type: Number, required: true, default: 5, min: 0, max: 100 },
    commissionMax: { type: Number, required: true, default: 25, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    creators: { type: [CampaignCreatorSchema], default: [] },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);

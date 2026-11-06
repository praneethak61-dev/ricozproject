import mongoose, { Schema, Document, Types } from 'mongoose';

export type NegotiationStatus = 'pending' | 'in_progress' | 'needs_human' | 'agreed' | 'rejected' | 'expired';

export interface INegotiationMessage {
  role: 'brand' | 'creator' | 'ai_agent';
  message: string;
  proposedRate?: number;
  timestamp: Date;
}

export interface INegotiation extends Document {
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  status: NegotiationStatus;
  commissionMin: number;
  commissionMax: number;
  currentOffer: number;
  finalRate?: number;
  messages: INegotiationMessage[];
  autoNegotiate: boolean;
  maxRounds: number;
  currentRound: number;
  createdAt: Date;
  updatedAt: Date;
}

const NegotiationMessageSchema = new Schema<INegotiationMessage>(
  {
    role: { type: String, enum: ['brand', 'creator', 'ai_agent'], required: true },
    message: { type: String, required: true },
    proposedRate: { type: Number, min: 0, max: 100 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const NegotiationSchema = new Schema<INegotiation>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'needs_human', 'agreed', 'rejected', 'expired'],
      default: 'pending',
    },
    commissionMin: { type: Number, required: true, min: 0, max: 100 },
    commissionMax: { type: Number, required: true, min: 0, max: 100 },
    currentOffer: { type: Number, required: true, min: 0, max: 100 },
    finalRate: { type: Number, min: 0, max: 100 },
    messages: { type: [NegotiationMessageSchema], default: [] },
    autoNegotiate: { type: Boolean, default: true },
    maxRounds: { type: Number, default: 5, min: 1, max: 10 },
    currentRound: { type: Number, default: 0 },
  },
  { timestamps: true }
);

NegotiationSchema.index({ brandId: 1, creatorId: 1, campaignId: 1 });

export const Negotiation = mongoose.model<INegotiation>('Negotiation', NegotiationSchema);

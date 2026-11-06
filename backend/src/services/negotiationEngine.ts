import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { INegotiation } from '../models/Negotiation';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface NegotiationResponse {
  message: string;
  proposedRate: number;
  shouldAccept: boolean;
  reasoning: string;
}

/**
 * AI-powered commission negotiation engine.
 * Operates within bounded guardrails (min/max commission rates).
 * Uses Gemini AI to generate contextual negotiation responses.
 */
export async function generateNegotiationResponse(
  negotiation: INegotiation,
  creatorName: string,
  brandName: string,
  creatorCounterRate?: number
): Promise<NegotiationResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const conversationHistory = negotiation.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.message}${m.proposedRate ? ` (Proposed: ${m.proposedRate}%)` : ''}`)
    .join('\n');

  const midPoint = (negotiation.commissionMin + negotiation.commissionMax) / 2;
  const currentRound = negotiation.currentRound;
  const maxRounds = negotiation.maxRounds;

  // Strategy: start low, concede gradually, never exceed max
  const prompt = `You are an expert AI negotiation agent representing the brand "${brandName}" in a commission rate negotiation with the influencer "${creatorName}".

GUARDRAILS (strict boundaries):
- Minimum commission: ${negotiation.commissionMin}% (never offer less)
- Maximum commission: ${negotiation.commissionMax}% (NEVER exceed this)
- Current round: ${currentRound + 1} of ${maxRounds}
- Current offer on table: ${negotiation.currentOffer}%
${creatorCounterRate ? `- Creator's counter-proposal: ${creatorCounterRate}%` : ''}

NEGOTIATION HISTORY:
${conversationHistory || 'No previous messages — this is the opening offer.'}

STRATEGY GUIDELINES:
- Round 1: Start near the lower end (around ${negotiation.commissionMin + 2}%)
- Middle rounds: Gradually concede toward the midpoint (${midPoint}%)
- Final rounds: Be more flexible but NEVER exceed ${negotiation.commissionMax}%
- If creator asks for more than ${negotiation.commissionMax}%, firmly but politely decline
- Be professional, warm, and emphasize mutual value
- Reference the brand's reach, campaign goals, and long-term partnership potential

Return as JSON:
{
  "message": "<the negotiation message to send>",
  "proposedRate": <number between ${negotiation.commissionMin} and ${negotiation.commissionMax}>,
  "shouldAccept": <true if the current terms are acceptable>,
  "reasoning": "<internal reasoning for this decision>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Enforce guardrails — clamp the proposed rate
    const clampedRate = Math.max(
      negotiation.commissionMin,
      Math.min(negotiation.commissionMax, parsed.proposedRate || midPoint)
    );

    return {
      message: parsed.message || `We'd like to propose a ${clampedRate}% commission rate for this partnership.`,
      proposedRate: clampedRate,
      shouldAccept: parsed.shouldAccept || false,
      reasoning: parsed.reasoning || 'Standard negotiation strategy applied.',
    };
  } catch (error) {
    console.error('Negotiation AI error:', error);
    // Fallback: simple algorithmic negotiation
    let fallbackRate: number;
    if (currentRound === 0) {
      fallbackRate = negotiation.commissionMin + 2;
    } else if (creatorCounterRate && creatorCounterRate <= negotiation.commissionMax) {
      fallbackRate = Math.round((negotiation.currentOffer + creatorCounterRate) / 2);
    } else {
      fallbackRate = Math.min(negotiation.currentOffer + 2, negotiation.commissionMax);
    }
    fallbackRate = Math.max(negotiation.commissionMin, Math.min(negotiation.commissionMax, fallbackRate));

    return {
      message: `Thank you for your interest in partnering with ${brandName}. We'd like to propose a commission rate of ${fallbackRate}% for this campaign. This reflects the value of our brand's audience reach and the exciting campaign ahead.`,
      proposedRate: fallbackRate,
      shouldAccept: creatorCounterRate ? creatorCounterRate <= negotiation.commissionMax : false,
      reasoning: 'Fallback algorithmic strategy — AI generation failed.',
    };
  }
}

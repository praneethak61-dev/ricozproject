import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface SentimentResult {
  safetyScore: number;
  flags: string[];
  summary: string;
}

/**
 * Analyzes creator content for brand safety using Gemini AI.
 * Returns a safety score (0-100) and risk flags.
 */
export async function analyzeBrandSafety(
  channelTitle: string,
  description: string,
  videoTitles: string[]
): Promise<SentimentResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contentSample = videoTitles.slice(0, 10).join('\n- ');

    const prompt = `You are a brand safety analyst. Analyze this creator's content for potential brand safety risks.

Creator: "${channelTitle}"
Description: "${description.substring(0, 500)}"
Recent content titles:
- ${contentSample}

Evaluate for these risk categories:
1. Controversial opinions (political, religious)
2. Adult/NSFW content
3. Profanity/offensive language
4. Misleading claims
5. Competitor mentions
6. Negative sentiment
7. Low quality/spam content

Return your analysis as JSON:
{
  "safetyScore": <0-100, where 100 is perfectly safe>,
  "flags": [<array of detected risk category strings, empty if safe>],
  "summary": "<one sentence summary of safety assessment>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      safetyScore: Math.max(0, Math.min(100, parsed.safetyScore || 80)),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      summary: parsed.summary || 'Analysis complete.',
    };
  } catch (error) {
    console.warn('Brand safety analysis failed, using default score:', error);
    return {
      safetyScore: 75,
      flags: [],
      summary: 'Unable to perform detailed analysis. Default safety score assigned.',
    };
  }
}

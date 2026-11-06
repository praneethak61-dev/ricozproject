import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { IBrand } from '../models/Brand';
import { ICreator } from '../models/Creator';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface EmailOutput {
  subject: string;
  body: string;
}

export interface CommissionOffer {
  commissionMin: number;
  commissionMax: number;
}

export async function generateOutreachEmail(
  brand: IBrand,
  creator: ICreator,
  isFollowUp: boolean = false,
  offer?: CommissionOffer
): Promise<EmailOutput> {
  const fallback = () =>
    isFollowUp ? fallbackFollowUp(brand, creator) : fallbackInitial(brand, creator, offer);

  if (!env.GEMINI_API_KEY) {
    return fallback();
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = isFollowUp
    ? buildFollowUpPrompt(brand, creator)
    : buildInitialPrompt(brand, creator, offer);

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (error) {
    console.warn('Gemini email generation failed, using template:', error);
    return fallback();
  }

  // Parse the response — expect JSON with subject and body
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || `Collaboration opportunity with ${brand.name}`,
      body: appendComplianceFooter(parsed.body || text, brand),
    };
  } catch {
    // If not valid JSON, use the raw text
    const lines = text.split('\n');
    const subject = lines[0]?.replace(/^(Subject:\s*)/i, '') || `Collaboration opportunity with ${brand.name}`;
    const body = lines.slice(1).join('\n').trim() || text;
    return {
      subject,
      body: appendComplianceFooter(body, brand),
    };
  }
}

function offerLine(offer?: CommissionOffer): string {
  if (!offer) return '';
  return `
Commission guardrail:
- This first email must offer ${offer.commissionMin}% of each sale through the creator's affiliate link.
- The brand can later agree up to ${offer.commissionMax}%. Do not offer more than ${offer.commissionMin}% in this email.
- Do not mention a flat fee. This is an affiliate commission.`;
}

function buildInitialPrompt(brand: IBrand, creator: ICreator, offer?: CommissionOffer): string {
  return `You are an expert outreach copywriter for influencer marketing.

Write a personalized outreach email from the brand "${brand.name}" to the YouTube creator "${creator.channelTitle}".

Brand details:
- Niche: ${brand.niche}
- Target audience: ${brand.targetAudience}
- Tone: ${brand.tone}
- Regions: ${brand.regions.join(', ')}

Creator details:
- Channel: ${creator.channelTitle}
- Subscribers: ${creator.subscriberCount.toLocaleString()}
- Channel description: ${creator.description.substring(0, 300)}
- Fit score reason: ${creator.fitReason}
${offerLine(offer)}

Requirements:
- Be genuine and personalized — reference the creator's content
- Keep it concise (150-250 words)
- Express interest in a collaboration, not a demand
- Use the brand's tone: "${brand.tone}"
- Do NOT include the compliance footer (it will be added automatically)

Return your response as JSON: { "subject": "...", "body": "..." }`;
}

function fallbackInitial(brand: IBrand, creator: ICreator, offer?: CommissionOffer): EmailOutput {
  const commission = offer
    ? ` We pay ${offer.commissionMin}% of every sale that comes through your link.`
    : '';
  return {
    subject: `${brand.name} × ${creator.channelTitle}`,
    body: appendComplianceFooter(
      `Hi ${creator.channelTitle} team,

I run ${brand.name}. We sell ${brand.niche} directly to customers, and your channel looks like a fit for the people we want to reach.${commission}

If you are open to an affiliate post, reply and I will send a product and a unique link. No pressure if the timing is off.

Thanks,
${brand.name}`,
      brand
    ),
  };
}

function fallbackFollowUp(brand: IBrand, creator: ICreator): EmailOutput {
  return {
    subject: `Following up — ${brand.name}`,
    body: appendComplianceFooter(
      `Hi ${creator.channelTitle} team,

Just checking whether my last note about a ${brand.name} affiliate post landed. Happy to answer questions if useful, and fine if now is not the right time.

Thanks,
${brand.name}`,
      brand
    ),
  };
}

function buildFollowUpPrompt(brand: IBrand, creator: ICreator): string {
  return `You are an expert outreach copywriter. Write a polite, brief follow-up email from "${brand.name}" to "${creator.channelTitle}".

This is a follow-up to a previous outreach about a brand collaboration.
- Keep it under 100 words
- Be respectful of their time
- Reference your previous email
- Use tone: "${brand.tone}"

Return as JSON: { "subject": "...", "body": "..." }`;
}

function appendComplianceFooter(body: string, brand: IBrand): string {
  return `${body}

---
Sent by: ${env.SENDER_NAME} (${env.SENDER_EMAIL})
${env.PHYSICAL_ADDRESS}
To unsubscribe from future emails, reply with "UNSUBSCRIBE" or click here: [unsubscribe_link]
This email was sent on behalf of ${brand.name}.`;
}

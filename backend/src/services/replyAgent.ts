export interface ReplyDecision {
  kind: 'above' | 'agree' | 'below' | 'question';
  askedRate?: number;
  proposedRate: number;
  answer: string;
}

function askedRate(message: string): number | undefined {
  const matches = [...message.matchAll(/(\d+(?:\.\d+)?)\s*(?:%|percent)/gi)];
  if (matches.length === 0) return undefined;
  const value = Number(matches[matches.length - 1][1]);
  if (!Number.isFinite(value)) return undefined;
  return value;
}

export function interpretCreatorReply(input: {
  message: string;
  commissionMin: number;
  commissionMax: number;
  brandName: string;
  productPrice: number;
}): ReplyDecision {
  const { message, commissionMin, commissionMax, brandName, productPrice } = input;
  const text = message.trim();
  const rate = askedRate(text);
  const offer = `The offer is ${commissionMin}% of each sale through a unique link. We can agree up to ${commissionMax}%, and no higher.`;

  if (rate !== undefined && rate > commissionMax) {
    return {
      kind: 'above',
      askedRate: rate,
      proposedRate: commissionMin,
      answer: `${rate}% is above the ${commissionMax}% ceiling. I have stopped and asked someone at ${brandName}. I will not agree to more than ${commissionMax}%.`,
    };
  }

  if (rate !== undefined && rate >= commissionMin && rate <= commissionMax) {
    return {
      kind: 'agree',
      askedRate: rate,
      proposedRate: rate,
      answer: `Yes. We can do ${rate}% of every sale that comes through your link.`,
    };
  }

  if (rate !== undefined && rate < commissionMin) {
    return {
      kind: 'below',
      askedRate: rate,
      proposedRate: commissionMin,
      answer: `The first offer is already ${commissionMin}% of each sale, so I will keep it there. We can go up to ${commissionMax}% if you need that, and not above it.`,
    };
  }

  const lower = text.toLowerCase();
  let answer: string;
  if (/product|sample|ship|send me|try it/.test(lower)) {
    answer = `Yes, we can send ${brandName} before you film. A product is about $${productPrice}. ${offer}`;
  } else if (/link|paid|pay|commission|invoice|how do/.test(lower)) {
    answer = `You get an affiliate link. We pay a commission on each sale that link brings. ${offer}`;
  } else if (/when|deadline|week|schedule|post date/.test(lower)) {
    answer = `A post in the next two weeks works. ${offer}`;
  } else {
    answer = `Happy to answer. ${offer}`;
  }

  return { kind: 'question', proposedRate: commissionMin, answer };
}

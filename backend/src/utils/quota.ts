// YouTube API quota tracker — resets daily at midnight UTC
const DAILY_LIMIT = 10000;

let quotaUsed = 0;
let lastResetDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function checkAndResetDate(): void {
  const today = new Date().toISOString().split('T')[0];
  if (today !== lastResetDate) {
    quotaUsed = 0;
    lastResetDate = today;
    console.log('🔄 YouTube API quota reset for new day');
  }
}

export function canUseQuota(cost: number): boolean {
  checkAndResetDate();
  return quotaUsed + cost <= DAILY_LIMIT;
}

export function useQuota(cost: number): void {
  checkAndResetDate();
  quotaUsed += cost;
  console.log(`📊 YouTube quota used: ${quotaUsed}/${DAILY_LIMIT} (+${cost})`);
}

export function getQuotaStatus(): { used: number; remaining: number; limit: number } {
  checkAndResetDate();
  return {
    used: quotaUsed,
    remaining: DAILY_LIMIT - quotaUsed,
    limit: DAILY_LIMIT,
  };
}

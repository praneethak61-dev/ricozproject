export interface SalesEstimate {
  views: number;
  sales: number;
  commission: number;
  productPrice: number;
  commissionPercent: number;
}

/** Guess: 2% of subscribers watch, 2% of those viewers buy. */
export function estimateSales(subscribers: number, commissionPercent: number, productPrice: number): SalesEstimate {
  const views = Math.max(0, Math.round(subscribers * 0.02));
  const sales = Math.max(0, Math.round(views * 0.02));
  const commission = Math.round(sales * productPrice * (commissionPercent / 100));
  return { views, sales, commission, productPrice, commissionPercent };
}

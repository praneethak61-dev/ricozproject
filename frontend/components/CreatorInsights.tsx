import { estimateSales } from '@/lib/estimate';

export interface ScoreBreakdown {
  niche: number;
  engagement: number;
  consistency: number;
}

export interface RecentVideo {
  title: string;
  publishedAt?: string;
}

export function CreatorInsights({
  breakdown,
  videos,
  subscribers,
  commissionPercent,
  productPrice,
  sample,
}: {
  breakdown?: ScoreBreakdown;
  videos?: RecentVideo[];
  subscribers: number;
  commissionPercent: number;
  productPrice: number;
  sample?: boolean;
}) {
  const estimate = estimateSales(subscribers, commissionPercent, productPrice);
  const bars = [
    { label: 'Niche', value: breakdown?.niche ?? 0 },
    { label: 'Engagement', value: breakdown?.engagement ?? 0 },
    { label: 'Posting', value: breakdown?.consistency ?? 0 },
  ];
  const titles = (videos || []).slice(0, 3);

  return (
    <div className="insights">
      {sample && <div className="badge badge-warning">Sample data, not live YouTube</div>}
      <div className="fit-bars">
        {bars.map((bar) => (
          <div key={bar.label} className="fit-row">
            <span>{bar.label}</span>
            <div className="fit-track"><span style={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }} /></div>
            <strong>{Math.round(bar.value)}</strong>
          </div>
        ))}
      </div>
      {titles.length > 0 && (
        <ul className="video-list">
          {titles.map((video) => <li key={video.title}>{video.title}</li>)}
        </ul>
      )}
      {commissionPercent > 0 && (
        <p className="estimate">
          Guess, not a promise: about {estimate.views.toLocaleString()} views, about {estimate.sales.toLocaleString()} sales,
          about ${estimate.commission.toLocaleString()} commission at {commissionPercent}% of a ${productPrice} product.
          Assumes 2% of subscribers watch and 2% of those viewers buy.
        </p>
      )}
    </div>
  );
}

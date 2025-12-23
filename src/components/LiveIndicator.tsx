import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  minute: number | null;
  status: string;
  className?: string;
}

export const LiveIndicator = ({ minute, status, className }: LiveIndicatorProps) => {
  if (status === 'LIVE') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
        </span>
        <span className="text-live font-bold text-sm">{minute}'</span>
      </div>
    );
  }

  if (status === 'HT') {
    return (
      <span className={cn('status-badge status-ht', className)}>HT</span>
    );
  }

  if (status === 'FT') {
    return (
      <span className={cn('status-badge status-ft', className)}>FT</span>
    );
  }

  return null;
};

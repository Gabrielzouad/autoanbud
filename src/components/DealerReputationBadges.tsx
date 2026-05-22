import { CheckCircle2, Star, Trophy, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  DealerBadgeKey,
  DealerReputationBadge,
} from '@/lib/services/dealerReputation';

const badgeStyles: Record<DealerBadgeKey, string> = {
  verified: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  high_rating: 'border-amber-200 bg-amber-50 text-amber-800',
  fast_response: 'border-sky-200 bg-sky-50 text-sky-800',
  top_performer: 'border-violet-200 bg-violet-50 text-violet-800',
};

const badgeIcons = {
  verified: CheckCircle2,
  high_rating: Star,
  fast_response: Zap,
  top_performer: Trophy,
} satisfies Record<DealerBadgeKey, typeof CheckCircle2>;

export function DealerReputationBadges({
  badges,
  className,
  compact = false,
}: {
  badges: DealerReputationBadge[];
  className?: string;
  compact?: boolean;
}) {
  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.key];

        return (
          <Badge
            key={badge.key}
            variant='outline'
            title={badge.description}
            className={cn(
              'gap-1 hover:bg-inherit',
              compact && 'px-1.5 text-[11px]',
              badgeStyles[badge.key],
            )}
          >
            <Icon className='h-3.5 w-3.5' />
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}

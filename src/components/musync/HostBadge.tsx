import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function HostBadge() {
  return (
    <Badge variant="primary">
      <Crown className="w-3 h-3" />
      Host
    </Badge>
  );
}

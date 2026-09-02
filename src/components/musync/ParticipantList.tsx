import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { Participant } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  className?: string;
}

export function ParticipantList({ participants, className }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="w-8 h-8 text-text-muted mb-2" />
        <p className="text-small text-text-secondary font-medium">No participants yet</p>
        <p className="text-tiny text-text-muted mt-0.5">
          Share your room code with friends
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {participants.map((p) => (
        <div
          key={p.id}
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-medium transition-colors',
            'hover:bg-white/5'
          )}
        >
          <ParticipantAvatar
            name={p.name}
            isHost={p.isHost}
            status={p.status}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-small font-medium text-text-primary truncate">
                {p.name}
              </span>
              {p.isHost && (
                <span className="text-tiny text-primary font-medium">Host</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

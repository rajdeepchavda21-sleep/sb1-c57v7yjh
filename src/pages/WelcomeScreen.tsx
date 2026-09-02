import { Plus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WelcomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function WelcomeScreen({ onCreateRoom, onJoinRoom }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl opacity-30 gradient-primary rounded-full" />
          <h1 className="relative text-display font-bold gradient-primary-text lowercase tracking-tight">
            musync
          </h1>
        </div>
        <p className="text-body text-text-secondary font-medium">
          Sync your music.
        </p>
        <p className="text-body text-text-muted">
          Share the moment.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 max-w-[260px]">
        <Button size="lg" fullWidth onClick={onCreateRoom}>
          <Plus className="w-4 h-4" />
          Create Room
        </Button>
        <Button size="lg" variant="secondary" fullWidth onClick={onJoinRoom}>
          <LogIn className="w-4 h-4" />
          Join Room
        </Button>
      </div>
    </div>
  );
}

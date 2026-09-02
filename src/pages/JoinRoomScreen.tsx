import { useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

interface JoinRoomScreenProps {
  onBack: () => void;
  onJoin: (code: string) => void;
}

export function JoinRoomScreen({ onBack, onJoin }: JoinRoomScreenProps) {
  const [code, setCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(upper.slice(0, 6));
  };

  const handleJoin = () => {
    if (code.length === 6) {
      onJoin(code);
    }
  };

  return (
    <div className="flex flex-col h-full px-5 pt-4 pb-6 animate-slide-in-right">
      <div className="flex items-center gap-2 mb-6">
        <IconButton label="Back" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </IconButton>
        <h2 className="text-h2 font-semibold text-text-primary">Join a room</h2>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <label htmlFor="room-code" className="text-small font-medium text-text-secondary">
          Room code
        </label>
        <input
          id="room-code"
          value={code}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="XXXXXX"
          maxLength={6}
          autoFocus
          className="w-full h-14 bg-surface border border-border rounded-large text-center text-h1 font-bold tracking-[0.3em] text-text-primary uppercase placeholder:text-text-muted placeholder:tracking-[0.3em] placeholder:text-h2 transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <p className="text-tiny text-text-muted">
          Enter the 6-character code from the host
        </p>
      </div>

      <Button
        size="lg"
        fullWidth
        onClick={handleJoin}
        disabled={code.length !== 6}
        className="mt-6"
      >
        <LogIn className="w-4 h-4" />
        Join Room
      </Button>
    </div>
  );
}

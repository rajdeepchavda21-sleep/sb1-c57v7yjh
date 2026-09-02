import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { IconButton } from '@/components/ui/IconButton';
import { Crown, Users } from 'lucide-react';
import type { PlaybackControlMode } from '@/types';

interface CreateRoomScreenProps {
  onBack: () => void;
  onCreate: (roomName: string, playbackControl: PlaybackControlMode) => void;
}

export function CreateRoomScreen({ onBack, onCreate }: CreateRoomScreenProps) {
  const [roomName, setRoomName] = useState('');
  const [playbackControl, setPlaybackControl] = useState<PlaybackControlMode>('host');

  const handleCreate = () => {
    const name = roomName.trim() || 'My Room';
    onCreate(name, playbackControl);
  };

  return (
    <div className="flex flex-col h-full px-5 pt-4 pb-6 animate-slide-in-right">
      <div className="flex items-center gap-2 mb-6">
        <IconButton label="Back" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </IconButton>
        <h2 className="text-h2 font-semibold text-text-primary">Create a room</h2>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        <div className="flex flex-col gap-2">
          <label htmlFor="room-name" className="text-small font-medium text-text-secondary">
            Room name
          </label>
          <Input
            id="room-name"
            placeholder="My Awesome Room"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={40}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-small font-medium text-text-secondary">
            Playback control
          </label>
          <Toggle
            options={[
              { value: 'host', label: 'Host only', icon: <Crown className="w-3.5 h-3.5" /> },
              { value: 'everyone', label: 'Everyone', icon: <Users className="w-3.5 h-3.5" /> },
            ]}
            value={playbackControl}
            onChange={setPlaybackControl}
          />
          <p className="text-tiny text-text-muted">
            {playbackControl === 'host'
              ? 'Only the host can control playback'
              : 'Anyone in the room can control playback'}
          </p>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={handleCreate} className="mt-6">
        <Plus className="w-4 h-4" />
        Create Room
      </Button>
    </div>
  );
}

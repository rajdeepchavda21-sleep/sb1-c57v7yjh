import { useState, useCallback, useEffect } from 'react';
import { Settings, X, User, Monitor, Volume2, Info, Youtube } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { ToastContainer, type ToastData } from '@/components/ui/Toast';
import { WelcomeScreen } from '@/pages/WelcomeScreen';
import { CreateRoomScreen } from '@/pages/CreateRoomScreen';
import { JoinRoomScreen } from '@/pages/JoinRoomScreen';
import { RoomScreen } from '@/pages/RoomScreen';
import { cn } from '@/lib/utils';
import { useExtensionState } from '@/hooks/useExtensionState';
import type { PlaybackControlMode } from '@/types';

const POPUP_WIDTH = 380;
const POPUP_HEIGHT = 560;

export default function App() {
  const {
    screen,
    room,
    connectionStatus,
    youtubeVideoId,
    playerState,
    syncState,
    isExtension,
    createRoom,
    joinRoom,
    leaveRoom,
    navigateTo,
    sendPlayerCommand,
    demoMedia,
  } = useExtensionState();

  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('You');

  const addToast = useCallback((message: string, variant: ToastData['variant'] = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCreateRoom = useCallback(
    async (roomName: string, playbackControl: PlaybackControlMode) => {
      await createRoom(roomName, playbackControl);
      addToast('Room created', 'success');
    },
    [createRoom, addToast]
  );

  const handleJoinRoom = useCallback(
    async (code: string) => {
      await joinRoom(code);
      addToast('Joined room', 'success');
    },
    [joinRoom, addToast]
  );

  const handleLeaveRoom = useCallback(async () => {
    await leaveRoom();
    addToast('Left room', 'info');
  }, [leaveRoom, addToast]);

  const handleCopyCode = useCallback(() => {
    addToast('Room code copied', 'success');
  }, [addToast]);

  useEffect(() => {
    setSettingsOpen(false);
  }, [screen]);

  return (
    <div
      className="flex flex-col bg-background overflow-hidden relative select-none"
      style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT }}
    >
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <span className="text-h3 font-bold gradient-primary-text lowercase tracking-tight">
          musync
        </span>
        <div className="flex items-center gap-1">
          {youtubeVideoId && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-small bg-error/10 text-error text-tiny font-medium">
              <Youtube className="w-3 h-3" />
              YouTube
            </span>
          )}
          <div className="relative">
            <IconButton
              label="Settings"
              size="sm"
              onClick={() => setSettingsOpen((s) => !s)}
            >
              <Settings className="w-4 h-4" />
            </IconButton>

            {settingsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSettingsOpen(false)}
                />
                <div
                  className={cn(
                    'absolute top-9 right-0 z-50 w-56 bg-surface-elevated border border-border rounded-medium shadow-elevated',
                    'animate-scale-in origin-top-right p-2'
                  )}
                >
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                    <span className="text-small font-semibold text-text-primary">Settings</span>
                    <IconButton label="Close settings" size="sm" onClick={() => setSettingsOpen(false)}>
                      <X className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-small hover:bg-white/5 transition-colors">
                      <User className="w-4 h-4 text-text-muted shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-tiny text-text-muted">Display name</span>
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="text-small text-text-primary bg-transparent border-none outline-none w-full"
                          maxLength={20}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-small">
                      <Monitor className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-small text-text-secondary flex-1">Extension version</span>
                      <span className="text-tiny text-text-muted">0.1.0</span>
                    </div>

                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-small">
                      <Volume2 className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-small text-text-secondary flex-1">Platform</span>
                      <span className="text-tiny text-text-muted">YouTube</span>
                    </div>

                    <div className="h-px bg-border my-1" />

                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-small">
                      <Info className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-small text-text-muted">
                        {isExtension ? 'Extension mode' : 'Dev mode'} — Phase 3
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex-1 overflow-hidden relative">
        {screen === 'welcome' && (
          <WelcomeScreen
            onCreateRoom={() => navigateTo('create')}
            onJoinRoom={() => navigateTo('join')}
          />
        )}

        {screen === 'create' && (
          <CreateRoomScreen
            onBack={() => navigateTo('welcome')}
            onCreate={handleCreateRoom}
          />
        )}

        {screen === 'join' && (
          <JoinRoomScreen
            onBack={() => navigateTo('welcome')}
            onJoin={handleJoinRoom}
          />
        )}

        {screen === 'room' && room && (
          <RoomScreen
            room={room}
            connectionStatus={connectionStatus}
            onLeave={handleLeaveRoom}
            onCopyCode={handleCopyCode}
            playerState={playerState}
            syncState={syncState}
            onPlayPause={() => sendPlayerCommand(playerState.playing ? 'pause' : 'play')}
            onSeek={(pos) => sendPlayerCommand('seek', pos)}
            demoMedia={demoMedia}
          />
        )}
      </div>
    </div>
  );
}

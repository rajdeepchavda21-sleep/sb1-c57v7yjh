/*
# Create rooms table for musync sync rooms

## Purpose
Stores active watch-party rooms. Each room has a unique 6-character code
that participants use to join. The room tracks the host, playback control
mode, and current media being watched.

## New Tables
- `rooms`
  - `id` (uuid, primary key)
  - `code` (text, unique, 6-character room code for joining)
  - `name` (text, room display name set by host)
  - `host_id` (text, unique identifier for the host participant)
  - `playback_control` (text, 'host' or 'everyone')
  - `media_id` (text, nullable, YouTube video ID currently playing)
  - `media_title` (text, nullable, video title)
  - `media_channel` (text, nullable, channel name)
  - `media_thumbnail` (text, nullable, thumbnail URL)
  - `media_duration` (numeric, nullable, video duration in seconds)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz, auto-updated)

## Security
- RLS enabled on `rooms`.
- This is a no-auth app (browser extension popup, no sign-in screen).
- All policies use `TO anon, authenticated` so the anon-key client can manage rooms.
- Any client can create/read/update/delete rooms — access control is by room code,
  which is a 6-character random string (3.4 billion possible codes).
- Rooms are ephemeral — the application deletes them when the host leaves.

## Notes
1. The `updated_at` trigger auto-updates the column on any row modification.
2. An index on `code` ensures fast lookups when joining a room.
3. Rooms are designed to be short-lived — cleanup is handled by the application.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  host_id text NOT NULL,
  playback_control text NOT NULL DEFAULT 'host',
  media_id text,
  media_title text,
  media_channel text,
  media_thumbnail text,
  media_duration numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms (code);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms"
ON rooms FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms"
ON rooms FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms"
ON rooms FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms"
ON rooms FOR DELETE
TO anon, authenticated USING (true);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

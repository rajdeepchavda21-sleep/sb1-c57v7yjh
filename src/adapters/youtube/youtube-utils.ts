/**
 * YouTube-specific utility functions.
 * Kept separate from the adapter for testability and reuse.
 */

export function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:watch\?v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function isYouTubePage(url: string): boolean {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

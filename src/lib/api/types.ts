import type { Account, CustomEmoji } from './client';

/** The fields of Mastodon's MediaAttachment entity this app uses. */
export interface MediaAttachment {
  id: string;
  type: 'unknown' | 'image' | 'gifv' | 'video' | 'audio';
  url: string | null;
  /** A still image, also for videos and gifs. Can be null for audio and unknown types. */
  preview_url: string | null;
  description: string | null;
}

/** The fields of Mastodon's Status entity this app uses. */
export interface Status {
  id: string;
  created_at: string;
  url: string | null;
  /** HTML from the server: only ever render it through the sanitizer in html.ts */
  content: string;
  spoiler_text: string;
  sensitive: boolean;
  media_attachments: MediaAttachment[];
  emojis: CustomEmoji[];
  visibility: 'public' | 'unlisted' | 'private' | 'direct';
  account: Account;
  reblog: Status | null;
}

export type NotificationType = 'favourite' | 'reblog' | 'mention';

export interface Notification {
  id: string;
  type: string;
  created_at: string;
  account: Account;
  status?: Status;
}

export interface Conversation {
  id: string;
  unread: boolean;
  accounts: Account[];
  last_status: Status | null;
}

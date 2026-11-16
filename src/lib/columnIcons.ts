import { AtSign, Mail, Pencil, Star } from '@lucide/svelte';
import type { ColumnId } from './unread';

/** The same icons mark the columns, the tabs and the items that belong to them. */
export const COLUMN_ICONS = { interactions: Star, mentions: AtSign, messages: Mail, posts: Pencil } satisfies Record<ColumnId, unknown>;

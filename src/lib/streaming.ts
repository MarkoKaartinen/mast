import type { StoredAccount } from '$lib/storage';

/** Wait before reconnecting after the first failure, doubled each time up to the maximum. */
const RECONNECT_MIN_MS = 5_000;
const RECONNECT_MAX_MS = 60_000;
/** Events often come in bursts (a boost and a favourite together), so refresh once after a short quiet time. */
export const DEBOUNCE_MS = 2_000;

/**
 * True when a streaming message means one of the columns changed: a notification, a conversation update
 * or a status written by the account itself. Other home timeline posts are ignored.
 */
export function isRelevantEvent(raw: string, ownId: string): boolean {
  try {
    const message = JSON.parse(raw) as { event?: string; payload?: string };
    if (message.event === 'notification' || message.event === 'conversation') return true;
    if (message.event === 'update' && typeof message.payload === 'string') {
      // The payload of a status is a JSON string inside the JSON message
      return (JSON.parse(message.payload) as { account?: { id?: string } }).account?.id === ownId;
    }
  } catch {
    // Not JSON: ignore
  }
  return false;
}

/** The streaming API can live on another host: read it from the server, fall back to the server itself. */
async function streamingUrl(instance: string): Promise<string> {
  try {
    const response = await fetch(`${instance}/api/v2/instance`);
    const data = await response.json();
    const url: unknown = data?.configuration?.urls?.streaming;
    if (typeof url === 'string' && url.startsWith('wss://')) return `${url.replace(/\/$/, '')}/api/v1/streaming`;
  } catch {
    // Use the fallback below
  }
  return `${instance.replace(/^https:/, 'wss:')}/api/v1/streaming`;
}

/** Keeps a user stream open for an account and calls onChange (debounced) when something relevant happens. */
export function connectStream(account: StoredAccount, onChange: () => void): () => void {
  let socket: WebSocket | undefined;
  let stopped = false;
  let delay = RECONNECT_MIN_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function open() {
    const url = await streamingUrl(account.instance);
    if (stopped) return;
    // Browsers cannot set an Authorization header on a WebSocket: the documented alternative is the subprotocol
    socket = new WebSocket(`${url}?stream=user`, account.accessToken);
    socket.onopen = () => (delay = RECONNECT_MIN_MS);
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string' || !isRelevantEvent(event.data, account.id)) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(onChange, DEBOUNCE_MS);
    };
    socket.onclose = () => {
      if (stopped) return;
      reconnectTimer = setTimeout(open, delay);
      delay = Math.min(delay * 2, RECONNECT_MAX_MS);
    };
  }

  void open();
  return () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    clearTimeout(debounceTimer);
    socket?.close();
  };
}

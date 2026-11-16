import { describe, expect, it } from 'vitest';
import { isRelevantEvent } from './streaming';

const message = (event: string, payload?: unknown) => JSON.stringify({ stream: ['user'], event, payload: payload === undefined ? undefined : JSON.stringify(payload) });

describe('isRelevantEvent', () => {
  it('reacts to notifications and conversations', () => {
    expect(isRelevantEvent(message('notification', { id: '1' }), '7')).toBe(true);
    expect(isRelevantEvent(message('conversation', { id: '1' }), '7')).toBe(true);
  });

  it('reacts to own statuses only', () => {
    expect(isRelevantEvent(message('update', { account: { id: '7' } }), '7')).toBe(true);
    expect(isRelevantEvent(message('update', { account: { id: '8' } }), '7')).toBe(false);
  });

  it('ignores other events and broken messages', () => {
    expect(isRelevantEvent(message('delete', undefined), '7')).toBe(false);
    expect(isRelevantEvent('not json', '7')).toBe(false);
    expect(isRelevantEvent('{"event":"update","payload":"not json"}', '7')).toBe(false);
  });
});

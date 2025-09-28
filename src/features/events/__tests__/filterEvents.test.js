import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterEvents } from '../filterEvents.js';

describe('filterEvents', () => {
  const events = [
    {
      id: 'evt-1',
      deviceId: 'dev-1',
      orgId: 'org-a',
      actionType: 'device_login',
      severity: 'info',
      actor: 'system',
      message: 'Device logged in',
      timestamp: '2024-05-30T10:00:00Z'
    },
    {
      id: 'evt-2',
      deviceId: 'dev-2',
      orgId: 'org-a',
      actionType: 'policy_publish',
      severity: 'warning',
      actor: 'admin@example.com',
      message: 'Policy updated',
      timestamp: '2024-05-30T11:00:00Z'
    },
    {
      id: 'evt-3',
      deviceId: 'dev-1',
      orgId: 'org-b',
      actionType: 'app_install',
      severity: 'error',
      actor: 'system',
      message: 'Install failed',
      timestamp: '2024-05-29T08:00:00Z'
    }
  ];

  it('filters by org, action type, and severity', () => {
    const filters = {
      orgIds: ['org-a'],
      actionTypes: ['policy_publish'],
      severities: ['warning']
    };

    assert.deepEqual(filterEvents(events, filters), [events[1]]);
  });

  it('filters by device and date range', () => {
    const filters = {
      deviceIds: ['dev-1'],
      start: new Date('2024-05-29T09:00:00Z'),
      end: new Date('2024-05-31T00:00:00Z')
    };

    assert.deepEqual(filterEvents(events, filters), [events[0]]);
  });

  it('supports keyword search across message and actor', () => {
    const filters = { search: 'ADMIN' };

    assert.deepEqual(filterEvents(events, filters), [events[1]]);
  });

  it('returns all events when no filters are provided', () => {
    assert.deepEqual(filterEvents(events, {}), events);
  });
});

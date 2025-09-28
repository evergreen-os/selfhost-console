import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterDevices, __testables } from '../filterDevices.js';

const { normalizeSearch, isWithinDateRange } = __testables;

describe('filterDevices', () => {
  const devices = [
    {
      id: '1',
      hostname: 'alpha-01',
      model: 'EvergreenBook',
      osVersion: '1.2.3',
      policyVersion: '2024.05',
      health: 'healthy',
      orgId: 'org-a',
      lastSeen: '2024-05-30T12:00:00Z',
      status: 'online'
    },
    {
      id: '2',
      hostname: 'beta-02',
      model: 'EvergreenSlate',
      osVersion: '1.2.3',
      policyVersion: '2024.04',
      health: 'degraded',
      orgId: 'org-b',
      lastSeen: '2024-05-29T09:30:00Z',
      status: 'offline'
    },
    {
      id: '3',
      hostname: 'gamma-03',
      model: 'EvergreenBook',
      osVersion: '1.2.2',
      policyVersion: '2024.05',
      health: 'healthy',
      orgId: 'org-a',
      lastSeen: '2024-05-28T15:45:00Z',
      status: 'online'
    }
  ];

  it('filters by organization and status', () => {
    const filters = {
      orgIds: ['org-a'],
      statuses: ['online']
    };

    assert.deepEqual(filterDevices(devices, filters), [devices[0], devices[2]]);
  });

  it('filters by search term using hostname and model', () => {
    const filters = {
      search: 'slate'
    };

    assert.deepEqual(filterDevices(devices, filters), [devices[1]]);
  });

  it('filters by last seen date range', () => {
    const filters = {
      lastSeenAfter: new Date('2024-05-29T00:00:00Z'),
      lastSeenBefore: new Date('2024-05-31T00:00:00Z')
    };

    assert.deepEqual(filterDevices(devices, filters), [devices[0], devices[1]]);
  });

  it('returns all devices when no filters provided', () => {
    assert.deepEqual(filterDevices(devices, {}), devices);
  });

  it('ensures search is case-insensitive and trims whitespace', () => {
    const filters = {
      search: '  ALPHA  '
    };

    assert.deepEqual(filterDevices(devices, filters), [devices[0]]);
  });
});

describe('normalizeSearch', () => {
  it('trims whitespace and lowercases text', () => {
    assert.equal(normalizeSearch('  Hello  '), 'hello');
  });

  it('returns undefined for empty results', () => {
    assert.equal(normalizeSearch('   '), undefined);
    assert.equal(normalizeSearch(undefined), undefined);
  });
});

describe('isWithinDateRange', () => {
  it('validates timestamps in range', () => {
    const after = new Date('2024-05-01T00:00:00Z');
    const before = new Date('2024-05-31T00:00:00Z');

    assert.equal(isWithinDateRange('2024-05-15T12:00:00Z', after, before), true);
    assert.equal(isWithinDateRange('2024-04-30T12:00:00Z', after, before), false);
    assert.equal(isWithinDateRange('2024-06-01T12:00:00Z', after, before), false);
  });

  it('handles invalid timestamps', () => {
    assert.equal(isWithinDateRange('not-a-date'), false);
  });
});

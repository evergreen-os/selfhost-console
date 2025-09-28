import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeviceDetailView } from '../detailView.js';

test('buildDeviceDetailView surfaces summary, health, and event timeline', () => {
  const device = {
    id: 'device-1',
    hostname: 'evergreen-1',
    model: 'Evergreen Book',
    osVersion: '114.2.0',
    policyVersion: '42',
    lastSync: '2024-01-01T11:00:00Z',
    health: {
      battery: 0.82,
      diskFree: 0.55,
      temperatureC: 42,
    },
    installedApps: [
      { id: 'slack', name: 'Slack', version: '5.0.0' },
      { id: 'vscode', name: 'VS Code', version: '1.84.0' },
    ],
    updateStatus: { channel: 'stable', state: 'up_to_date' },
  };

  const events = [
    { id: 'evt-1', type: 'policy_publish', severity: 'info', timestamp: '2024-01-01T09:00:00Z', summary: 'Policy applied' },
    { id: 'evt-2', type: 'install', severity: 'info', timestamp: '2024-01-01T10:00:00Z', summary: 'Slack installed' },
    { id: 'evt-3', type: 'warning', severity: 'warning', timestamp: '2024-01-01T10:30:00Z', summary: 'Battery low' },
  ];

  const detail = buildDeviceDetailView(device, events);

  assert.deepEqual(detail.summary, {
    hostname: 'evergreen-1',
    model: 'Evergreen Book',
    osVersion: '114.2.0',
    policyVersion: '42',
    lastSync: new Date('2024-01-01T11:00:00Z'),
  });
  assert.equal(detail.installedApps.length, 2);
  assert.equal(detail.updateStatus.state, 'up_to_date');
  assert.deepEqual(detail.health, {
    battery: 82,
    diskFree: 55,
    temperatureC: 42,
    batteryStatus: 'healthy',
  });
  assert.equal(detail.timeline.items[0].id, 'evt-3');
  assert.equal(detail.timeline.items.at(-1).id, 'evt-1');
  assert.equal(detail.timeline.count, 3);
});

test('buildDeviceDetailView computes status banners', () => {
  const device = {
    id: 'device-2',
    hostname: 'evergreen-2',
    model: 'Evergreen Mini',
    osVersion: '114.2.0',
    policyVersion: '41',
    lastSync: '2023-12-31T11:00:00Z',
    health: {
      battery: 0.21,
      diskFree: 0.05,
      temperatureC: 72,
    },
    installedApps: [],
    updateStatus: { channel: 'beta', state: 'update_available' },
  };

  const events = [];

  const detail = buildDeviceDetailView(device, events);

  assert.equal(detail.statusBanner.level, 'critical');
  assert.ok(detail.statusBanner.messages.some((msg) => msg.includes('battery')));
  assert.ok(detail.statusBanner.messages.some((msg) => msg.includes('disk')));
  assert.ok(detail.statusBanner.messages.some((msg) => msg.includes('temperature')));
  assert.ok(detail.statusBanner.messages.some((msg) => msg.includes('update')));
});

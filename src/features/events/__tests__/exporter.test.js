import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { exportEvents } from '../exporter.js';

describe('event exporter', () => {
  const events = [
    { id: '1', type: 'install', severity: 'info', timestamp: '2024-01-01T00:00:00Z', actor: 'device-1', summary: 'Installed Slack' },
    { id: '2', type: 'policy_publish', severity: 'info', timestamp: '2024-01-02T00:00:00Z', actor: 'admin@example.com', summary: 'Published policy' },
  ];

  test('exports events as CSV', () => {
    const csv = exportEvents(events, { format: 'csv' });
    const rows = csv.trim().split('\n');

    assert.equal(rows[0], 'id,type,severity,timestamp,actor,summary');
    assert.ok(rows[1].includes('Installed Slack'));
    assert.ok(rows[2].includes('Published policy'));
  });

  test('exports events as JSON array', () => {
    const json = exportEvents(events, { format: 'json' });
    const parsed = JSON.parse(json);

    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].id, '1');
  });

  test('filters events before exporting', () => {
    const csv = exportEvents(events, { format: 'csv', filter: { actor: 'device-1' } });
    const rows = csv.trim().split('\n');
    assert.equal(rows.length, 2); // header + one row
  });
});

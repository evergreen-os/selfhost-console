import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildNavigation } from '../navigation.js';

describe('buildNavigation', () => {
  it('returns full navigation for owners', () => {
    const nav = buildNavigation('Owner');
    const labels = nav.map((item) => item.label);

    assert.deepEqual(labels, [
      'Devices',
      'Policies',
      'Events',
      'Users',
      'Tenants',
    ]);
    assert(nav.every((item) => item.disabled === false));
  });

  it('hides management menus for auditors while keeping read-only sections', () => {
    const nav = buildNavigation('Auditor');

    assert.deepEqual(nav.map((item) => ({ label: item.label, disabled: item.disabled })), [
      { label: 'Devices', disabled: false },
      { label: 'Policies', disabled: true },
      { label: 'Events', disabled: false },
    ]);
  });
});

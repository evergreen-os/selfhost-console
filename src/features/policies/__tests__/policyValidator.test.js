import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validatePolicyBundle, isPolicySigned } from '../policyValidator.js';

describe('validatePolicyBundle', () => {
  /** @type {import('../policyValidator.js').PolicyBundle} */
  let basePolicy;

  beforeEach(() => {
    basePolicy = {
      id: 'policy-1',
      name: 'Default Org Policy',
      version: '2024.05.01',
      orgId: 'org-123',
      configuration: {
        apps: [
          {
            id: 'app-slack',
            target: 'all'
          },
          {
            id: 'app-zoom',
            target: 'group',
            groupIds: ['group-1']
          }
        ],
        updateChannel: 'stable',
        browser: {
          homepageUrl: 'https://intranet.example.com',
          allowPopups: false
        },
        network: {
          wifiNetworks: [
            { ssid: 'District', security: 'wpa2' }
          ]
        },
        security: {
          diskEncryption: true,
          lockAfterMinutes: 5
        }
      },
      signature: {
        status: 'signed',
        signer: 'security-bot'
      }
    };
  });

  it('accepts a complete and well-typed policy bundle', () => {
    const result = validatePolicyBundle(basePolicy);

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('flags missing required top-level fields', () => {
    const { id, ...policyWithoutId } = basePolicy;

    const result = validatePolicyBundle(policyWithoutId);

    assert.equal(result.valid, false);
    assert.match(result.errors[0], /id is required/);
  });

  it('validates application assignments', () => {
    basePolicy.configuration.apps[1] = {
      id: 'app-zoom',
      target: 'group'
    };

    const result = validatePolicyBundle(basePolicy);

    assert.equal(result.valid, false);
    assert.match(result.errors[0], /groupIds is required/);
  });

  it('ensures update channel is one of the supported values', () => {
    basePolicy.configuration.updateChannel = 'nightly';

    const result = validatePolicyBundle(basePolicy);

    assert.equal(result.valid, false);
    assert.match(result.errors[0], /updateChannel/);
  });

  it('requires network and security sections', () => {
    // @ts-expect-error - simulate missing security section
    delete basePolicy.configuration.security;

    const result = validatePolicyBundle(basePolicy);

    assert.equal(result.valid, false);
    assert.match(result.errors[0], /configuration\.security is required/);
  });
});

describe('isPolicySigned', () => {
  it('returns true when signature status is signed', () => {
    assert.equal(
      isPolicySigned({ signature: { status: 'signed' } }),
      true
    );
  });

  it('returns false when signature is missing or unsigned', () => {
    assert.equal(isPolicySigned({}), false);
    assert.equal(isPolicySigned({ signature: { status: 'unsigned' } }), false);
  });
});

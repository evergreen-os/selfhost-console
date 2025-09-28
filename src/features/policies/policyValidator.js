/**
 * @typedef {Object} AppAssignment
 * @property {string} id
 * @property {'all' | 'group'} target
 * @property {string[]=} groupIds
 *
 * @typedef {Object} BrowserSettings
 * @property {string} homepageUrl
 * @property {boolean} allowPopups
 *
 * @typedef {Object} NetworkSettings
 * @property {{ ssid: string; security: 'wpa2' | 'wpa3' }[]} wifiNetworks
 *
 * @typedef {Object} SecuritySettings
 * @property {boolean} diskEncryption
 * @property {number} lockAfterMinutes
 *
 * @typedef {Object} PolicyConfiguration
 * @property {AppAssignment[]} apps
 * @property {'stable' | 'beta' | 'dev'} updateChannel
 * @property {BrowserSettings} browser
 * @property {NetworkSettings} network
 * @property {SecuritySettings} security
 *
 * @typedef {Object} PolicySignature
 * @property {'signed' | 'unsigned'} status
 * @property {string=} signer
 *
 * @typedef {Object} PolicyBundle
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} orgId
 * @property {PolicyConfiguration} configuration
 * @property {PolicySignature=} signature
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

const SUPPORTED_UPDATE_CHANNELS = new Set(['stable', 'beta', 'dev']);

/**
 * @param {PolicyBundle} policy
 * @returns {ValidationResult}
 */
export function validatePolicyBundle(policy) {
  const errors = [];

  if (!policy || typeof policy !== 'object') {
    return invalid(['policy bundle must be an object']);
  }

  for (const field of ['id', 'name', 'version', 'orgId']) {
    if (typeof policy[field] !== 'string' || policy[field].trim().length === 0) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  if (!policy.configuration || typeof policy.configuration !== 'object') {
    errors.push('configuration is required');
  } else {
    validateConfiguration(policy.configuration, errors);
  }

  return errors.length > 0 ? invalid(errors) : { valid: true, errors: [] };
}

/**
 * @param {PolicyConfiguration} configuration
 * @param {string[]} errors
 */
function validateConfiguration(configuration, errors) {
  if (!Array.isArray(configuration.apps) || configuration.apps.length === 0) {
    errors.push('configuration.apps must contain at least one app assignment');
  } else {
    configuration.apps.forEach((assignment, index) => {
      if (!assignment || typeof assignment !== 'object') {
        errors.push(`apps[${index}] must be an object`);
        return;
      }

      if (typeof assignment.id !== 'string' || assignment.id.trim().length === 0) {
        errors.push(`apps[${index}].id must be a non-empty string`);
      }

      if (assignment.target !== 'all' && assignment.target !== 'group') {
        errors.push(`apps[${index}].target must be either "all" or "group"`);
      }

      if (assignment.target === 'group') {
        if (!Array.isArray(assignment.groupIds) || assignment.groupIds.length === 0) {
          errors.push(`apps[${index}].groupIds must be provided for group targets`);
        }
      }
    });
  }

  if (!SUPPORTED_UPDATE_CHANNELS.has(configuration.updateChannel)) {
    errors.push('configuration.updateChannel must be stable, beta, or dev');
  }

  validateBrowser(configuration.browser, errors);
  validateNetwork(configuration.network, errors);
  validateSecurity(configuration.security, errors);
}

/**
 * @param {BrowserSettings} browser
 * @param {string[]} errors
 */
function validateBrowser(browser, errors) {
  if (!browser || typeof browser !== 'object') {
    errors.push('browser configuration is required');
    return;
  }

  if (typeof browser.homepageUrl !== 'string' || browser.homepageUrl.trim().length === 0) {
    errors.push('browser.homepageUrl must be a non-empty string');
  }

  if (typeof browser.allowPopups !== 'boolean') {
    errors.push('browser.allowPopups must be a boolean');
  }
}

/**
 * @param {NetworkSettings} network
 * @param {string[]} errors
 */
function validateNetwork(network, errors) {
  if (!network || typeof network !== 'object') {
    errors.push('network configuration is required');
    return;
  }

  if (!Array.isArray(network.wifiNetworks) || network.wifiNetworks.length === 0) {
    errors.push('network.wifiNetworks must contain at least one network');
    return;
  }

  network.wifiNetworks.forEach((wifi, index) => {
    if (typeof wifi?.ssid !== 'string' || wifi.ssid.trim().length === 0) {
      errors.push(`network.wifiNetworks[${index}].ssid must be a non-empty string`);
    }

    if (wifi.security !== 'wpa2' && wifi.security !== 'wpa3') {
      errors.push(`network.wifiNetworks[${index}].security must be wpa2 or wpa3`);
    }
  });
}

/**
 * @param {SecuritySettings} security
 * @param {string[]} errors
 */
function validateSecurity(security, errors) {
  if (!security || typeof security !== 'object') {
    errors.push('security configuration is required');
    return;
  }

  if (typeof security.diskEncryption !== 'boolean') {
    errors.push('security.diskEncryption must be a boolean');
  }

  if (
    typeof security.lockAfterMinutes !== 'number' ||
    !Number.isFinite(security.lockAfterMinutes) ||
    security.lockAfterMinutes <= 0
  ) {
    errors.push('security.lockAfterMinutes must be a positive number');
  }
}

/**
 * @param {string[]} errors
 * @returns {ValidationResult}
 */
function invalid(errors) {
  return { valid: false, errors };
}

/**
 * @param {Partial<PolicyBundle>} policy
 * @returns {boolean}
 */
export function isPolicySigned(policy) {
  return policy?.signature?.status === 'signed';
}

export const __testables = {
  validateBrowser,
  validateNetwork,
  validateSecurity
};


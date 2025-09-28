/**
 * @typedef {'Owner' | 'Admin' | 'Auditor'} Role
 *
 * @typedef {Object} Capabilities
 * @property {boolean} manageTenants
 * @property {boolean} manageUsers
 * @property {boolean} editPolicies
 * @property {boolean} viewDevices
 */

/**
 * @type {Record<Role, Capabilities>}
 */
const CAPABILITIES = {
  Owner: {
    manageTenants: true,
    manageUsers: true,
    editPolicies: true,
    viewDevices: true
  },
  Admin: {
    manageTenants: false,
    manageUsers: true,
    editPolicies: true,
    viewDevices: true
  },
  Auditor: {
    manageTenants: false,
    manageUsers: false,
    editPolicies: false,
    viewDevices: true
  }
};

/**
 * @param {Role} role
 * @returns {Capabilities}
 */
export function buildRoleCapabilities() {
  return Object.fromEntries(
    Object.entries(CAPABILITIES).map(([role, capabilities]) => [role, { ...capabilities }])
  );
}

export function getRoleCapabilities(role) {
  const capabilities = CAPABILITIES[role];

  if (!capabilities) {
    throw new Error(`Unknown role: ${role}`);
  }

  return capabilities;
}

/**
 * @param {Role} role
 * @param {keyof Capabilities} capability
 */
export function assertRoleAllows(role, capability) {
  const capabilities = getRoleCapabilities(role);

  if (!capabilities[capability]) {
    throw new Error(`${role} role does not allow ${capability}`);
  }
}

export function canEditPolicies(role) {
  return getRoleCapabilities(role).editPolicies;
}

export function canManageUsers(role) {
  return getRoleCapabilities(role).manageUsers;
}

export function canManageTenants(role) {
  return getRoleCapabilities(role).manageTenants;
}

export function canViewDevices(role) {
  return getRoleCapabilities(role).viewDevices;
}

export const __testables = { CAPABILITIES };

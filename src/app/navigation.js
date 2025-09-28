import { getRoleCapabilities } from '../features/users/rbac.js';

const NAVIGATION_ITEMS = [
  {
    id: 'devices',
    label: 'Devices',
    href: '/devices',
    capability: 'viewDevices',
  },
  {
    id: 'policies',
    label: 'Policies',
    href: '/policies',
    capability: 'editPolicies',
    allowReadOnly: true,
  },
  {
    id: 'events',
    label: 'Events',
    href: '/events',
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    capability: 'manageUsers',
  },
  {
    id: 'tenants',
    label: 'Tenants',
    href: '/tenants',
    capability: 'manageTenants',
  },
];

export function buildNavigation(role) {
  const capabilities = getRoleCapabilities(role);

  return NAVIGATION_ITEMS.filter((item) => {
    if (!item.capability) {
      return true;
    }
    if (capabilities[item.capability]) {
      return true;
    }
    return item.allowReadOnly === true;
  }).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    disabled: item.capability ? !capabilities[item.capability] : false,
  }));
}

export function getNavigationItems() {
  return [...NAVIGATION_ITEMS];
}

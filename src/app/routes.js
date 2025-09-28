import { getRoleCapabilities } from '../features/users/rbac.js';

const ROUTES = [
  {
    path: '/login',
    component: 'LoginPage',
    requiresAuth: false,
    segment: 'auth',
  },
  {
    path: '/',
    component: 'DashboardPage',
    requiresAuth: true,
    capability: 'viewDevices',
    segment: 'dashboard',
  },
  {
    path: '/devices',
    component: 'DeviceListPage',
    requiresAuth: true,
    capability: 'viewDevices',
    segment: 'devices',
  },
  {
    path: '/devices/:deviceId',
    component: 'DeviceDetailPage',
    requiresAuth: true,
    capability: 'viewDevices',
    segment: 'devices',
  },
  {
    path: '/policies',
    component: 'PolicyCatalogPage',
    requiresAuth: true,
    capability: 'editPolicies',
    allowReadOnly: true,
    segment: 'policies',
  },
  {
    path: '/policies/:policyId/edit',
    component: 'PolicyEditorPage',
    requiresAuth: true,
    capability: 'editPolicies',
    segment: 'policies',
  },
  {
    path: '/events',
    component: 'EventsPage',
    requiresAuth: true,
    segment: 'events',
  },
  {
    path: '/users',
    component: 'UserManagementPage',
    requiresAuth: true,
    capability: 'manageUsers',
    segment: 'users',
  },
  {
    path: '/tenants',
    component: 'TenantManagementPage',
    requiresAuth: true,
    capability: 'manageTenants',
    segment: 'tenants',
  },
];

export function getAccessibleRoutes(role) {
  const capabilities = getRoleCapabilities(role);

  return ROUTES.filter((route) => {
    if (!route.requiresAuth) {
      return true;
    }
    if (!route.capability) {
      return true;
    }
    if (capabilities[route.capability]) {
      return true;
    }
    return route.allowReadOnly === true;
  }).map((route) => ({
    ...route,
    disabled: route.capability ? !capabilities[route.capability] : false,
    mode:
      route.capability && !capabilities[route.capability] && route.allowReadOnly
        ? 'read-only'
        : 'full',
  }));
}

export function listRoutes() {
  return [...ROUTES];
}

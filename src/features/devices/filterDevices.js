/**
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} hostname
 * @property {string} model
 * @property {string} osVersion
 * @property {string} policyVersion
 * @property {string} health
 * @property {string} orgId
 * @property {string} lastSeen ISO8601 timestamp string
 * @property {string} status
 */

/**
 * @typedef {Object} DeviceFilters
 * @property {string[]=} orgIds
 * @property {string[]=} statuses
 * @property {string=} search
 * @property {Date=} lastSeenAfter
 * @property {Date=} lastSeenBefore
 */

/**
 * @param {string=} search
 * @returns {string | undefined}
 */
function normalizeSearch(search) {
  if (!search) {
    return undefined;
  }

  const normalized = search.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * @param {string} dateIso
 * @param {Date=} after
 * @param {Date=} before
 * @returns {boolean}
 */
function isWithinDateRange(dateIso, after, before) {
  const timestamp = Date.parse(dateIso);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  if (after && timestamp < after.getTime()) {
    return false;
  }

  if (before && timestamp > before.getTime()) {
    return false;
  }

  return true;
}

/**
 * @param {Device[]} devices
 * @param {DeviceFilters} filters
 * @returns {Device[]}
 */
export function filterDevices(devices, filters) {
  const normalizedSearch = normalizeSearch(filters.search);
  const orgIdSet = filters.orgIds ? new Set(filters.orgIds) : undefined;
  const statusSet = filters.statuses ? new Set(filters.statuses) : undefined;

  return devices.filter((device) => {
    if (orgIdSet && !orgIdSet.has(device.orgId)) {
      return false;
    }

    if (statusSet && !statusSet.has(device.status)) {
      return false;
    }

    if (
      normalizedSearch &&
      !(
        device.hostname.toLowerCase().includes(normalizedSearch) ||
        device.model.toLowerCase().includes(normalizedSearch)
      )
    ) {
      return false;
    }

    if (!isWithinDateRange(device.lastSeen, filters.lastSeenAfter, filters.lastSeenBefore)) {
      return false;
    }

    return true;
  });
}

export const __testables = {
  normalizeSearch,
  isWithinDateRange
};

/**
 * @typedef {Object} EventRecord
 * @property {string} id
 * @property {string} deviceId
 * @property {string} orgId
 * @property {string} actionType
 * @property {string} severity
 * @property {string} actor
 * @property {string} message
 * @property {string} timestamp ISO8601 date string
 *
 * @typedef {Object} EventFilters
 * @property {string[]=} orgIds
 * @property {string[]=} deviceIds
 * @property {string[]=} actors
 * @property {string=} actor
 * @property {string[]=} actionTypes
 * @property {string[]=} severities
 * @property {Date=} start
 * @property {Date=} end
 * @property {string=} search
 */

/**
 * @param {EventRecord[]} events
 * @param {EventFilters} filters
 * @returns {EventRecord[]}
 */
export function filterEvents(events, filters) {
  const orgSet = filters.orgIds ? new Set(filters.orgIds) : undefined;
  const deviceSet = filters.deviceIds ? new Set(filters.deviceIds) : undefined;
  const actionSet = filters.actionTypes ? new Set(filters.actionTypes) : undefined;
  const severitySet = filters.severities ? new Set(filters.severities) : undefined;
  const actorSet = filters.actors ? new Set(filters.actors) : undefined;
  const actorMatch = filters.actor;
  const normalizedSearch = normalizeSearch(filters.search);

  return events.filter((event) => {
    if (orgSet && !orgSet.has(event.orgId)) {
      return false;
    }

    if (deviceSet && !deviceSet.has(event.deviceId)) {
      return false;
    }

    if (actionSet && !actionSet.has(event.actionType)) {
      return false;
    }

    if (severitySet && !severitySet.has(event.severity)) {
      return false;
    }

    if (actorSet && !actorSet.has(event.actor)) {
      return false;
    }

    if (actorMatch && actorMatch !== event.actor) {
      return false;
    }

    if (!isWithinDateRange(event.timestamp, filters.start, filters.end)) {
      return false;
    }

    if (
      normalizedSearch &&
      !(
        event.message.toLowerCase().includes(normalizedSearch) ||
        event.actor.toLowerCase().includes(normalizedSearch)
      )
    ) {
      return false;
    }

    return true;
  });
}

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
 * @param {string} timestamp
 * @param {Date=} start
 * @param {Date=} end
 * @returns {boolean}
 */
function isWithinDateRange(timestamp, start, end) {
  const value = Date.parse(timestamp);

  if (Number.isNaN(value)) {
    return false;
  }

  if (start && value < start.getTime()) {
    return false;
  }

  if (end && value > end.getTime()) {
    return false;
  }

  return true;
}

export const __testables = { normalizeSearch, isWithinDateRange };

import { filterEvents } from '../events/filterEvents.js';

function toPercentage(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value * 100);
}

function batteryStatus(batteryPercent) {
  if (batteryPercent === null) return 'unknown';
  if (batteryPercent >= 60) return 'healthy';
  if (batteryPercent >= 40) return 'moderate';
  if (batteryPercent >= 20) return 'low';
  return 'critical';
}

function buildStatusBanner(device, health) {
  const messages = [];
  let level = 'info';

  if (health.battery !== null && health.battery < 30) {
    level = 'warning';
    messages.push('Device battery is below 30%.');
  }
  if (health.battery !== null && health.battery < 20) {
    level = 'critical';
    messages.push('Device battery is critically low.');
  }
  if (health.diskFree !== null && health.diskFree < 15) {
    level = 'critical';
    messages.push('Available disk space is critically low.');
  }
  if (typeof device.health?.temperatureC === 'number' && device.health.temperatureC > 70) {
    level = 'critical';
    messages.push('Device temperature exceeds safe limits.');
  }
  if (device.updateStatus?.state === 'update_available') {
    if (level !== 'critical') level = 'warning';
    messages.push('An OS update is ready to install.');
  }

  return {
    level,
    messages,
  };
}

export function buildDeviceDetailView(device, events, filters = {}) {
  const filteredEvents = filterEvents(events, {
    deviceId: device.id,
    limit: 50,
    ...filters,
  });

  const health = {
    battery: toPercentage(device.health?.battery),
    diskFree: toPercentage(device.health?.diskFree),
    temperatureC: device.health?.temperatureC ?? null,
  };
  health.batteryStatus = batteryStatus(health.battery);

  return {
    id: device.id,
    summary: {
      hostname: device.hostname,
      model: device.model,
      osVersion: device.osVersion,
      policyVersion: device.policyVersion,
      lastSync: device.lastSync ? new Date(device.lastSync) : null,
    },
    installedApps: Array.isArray(device.installedApps) ? device.installedApps.map((app) => ({
      id: app.id,
      name: app.name,
      version: app.version,
      publisher: app.publisher ?? null,
    })) : [],
    updateStatus: {
      channel: device.updateStatus?.channel ?? 'stable',
      state: device.updateStatus?.state ?? 'unknown',
    },
    health,
    statusBanner: buildStatusBanner(device, health),
    timeline: {
      count: filteredEvents.length,
      items: filteredEvents
        .slice(0, 50)
        .map((event) => ({
          id: event.id,
          type: event.type,
          severity: event.severity,
          timestamp: new Date(event.timestamp),
          summary: event.summary,
        }))
        .sort((a, b) => b.timestamp - a.timestamp),
    },
    actions: {
      canTriggerSync: true,
      canDecommission: true,
    },
  };
}

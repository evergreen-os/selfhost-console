import { filterEvents } from './filterEvents.js';

function toCsvRow(values) {
  return values
    .map((value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
    .join(',');
}

function exportAsCsv(events) {
  const header = 'id,type,severity,timestamp,actor,summary';
  const rows = events.map((event) =>
    toCsvRow([
      event.id,
      event.type,
      event.severity,
      event.timestamp,
      event.actor,
      event.summary,
    ])
  );
  return [header, ...rows].join('\n');
}

function exportAsJson(events) {
  return JSON.stringify(events, null, 2);
}

export function exportEvents(events, { format = 'csv', filter = {} } = {}) {
  const filtered = filterEvents(events, filter);
  if (format === 'json') {
    return exportAsJson(filtered);
  }
  if (format === 'csv') {
    return exportAsCsv(filtered);
  }
  throw new Error(`Unsupported export format: ${format}`);
}

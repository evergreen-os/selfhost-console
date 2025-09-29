'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EventsApi } from '@/lib/api/clients';
import { filterEvents } from '@/features/events/filterEvents.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

const SEVERITIES = ['info', 'warning', 'error'];

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', search, severity],
    queryFn: async () => {
      const response = await EventsApi.listEvents({ search: search || undefined, severity: severity || undefined });
      return response.events;
    }
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return filterEvents(data, {
      search,
      severities: severity ? [severity] : undefined
    }).slice(0, 200);
  }, [data, search, severity]);

  async function handleExport(format: 'csv' | 'json') {
    const blob = await EventsApi.exportEvents({ search: search || undefined, severity: severity || undefined }, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Search</label>
            <Input placeholder="Search events" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-48">
            <label className="text-xs font-semibold uppercase text-slate-500">Severity</label>
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All severities</option>
              {SEVERITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button variant="subtle" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button variant="subtle" onClick={() => handleExport('json')}>
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-slate-500">Loading events…</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {(error as Error).message}
        </p>
      )}

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Occurred</TableHeaderCell>
                <TableHeaderCell>Actor</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Severity</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatDate(event.timestamp || event.occurredAt)}</TableCell>
                  <TableCell>{event.actor}</TableCell>
                  <TableCell>{event.actionType || event.action}</TableCell>
                  <TableCell>{event.severity}</TableCell>
                  <TableCell>{event.message}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No events match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

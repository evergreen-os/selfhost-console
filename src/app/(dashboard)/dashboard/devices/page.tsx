'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DevicesClient } from '@gen/rest';
import { filterDevices } from '@/features/devices/filterDevices.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'decommissioned', label: 'Decommissioned' }
];

export default function DevicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devices', status, search],
    queryFn: async () => {
      const response = await DevicesClient.listDevices({ status: status || undefined, search: search || undefined });
      return response.devices;
    }
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return filterDevices(data, { statuses: status ? [status] : undefined, search });
  }, [data, status, search]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Search</label>
            <Input placeholder="Search by hostname or model" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-48">
            <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-slate-500">Loading devices…</p>}
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
                <TableHeaderCell>Hostname</TableHeaderCell>
                <TableHeaderCell>Model</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>OS Version</TableHeaderCell>
                <TableHeaderCell>Policy</TableHeaderCell>
                <TableHeaderCell>Health</TableHeaderCell>
                <TableHeaderCell>Last seen</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium text-slate-800">{device.hostname}</TableCell>
                  <TableCell>{device.model}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === 'online' ? 'success' : device.status === 'offline' ? 'warning' : 'danger'}>
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{device.osVersion}</TableCell>
                  <TableCell>{device.policyVersion}</TableCell>
                  <TableCell>
                    <Badge variant={device.health === 'healthy' ? 'success' : device.health === 'warning' ? 'warning' : 'danger'}>
                      {device.health}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(device.lastSeen)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/devices/${device.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    No devices match the selected filters.
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

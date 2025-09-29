'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DevicesApi } from '@/lib/api/clients';
import { detailView } from '@/features/devices/detailView.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { useSessionStore } from '@/hooks/useSessionStore';

export default function DeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useSessionStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['device', params.deviceId],
    queryFn: async () => {
      const response = await DevicesApi.getDevice(params.deviceId);
      return detailView(response);
    }
  });

  const syncMutation = useMutation({
    mutationFn: () => DevicesApi.triggerDeviceSync(params.deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device', params.deviceId] })
  });

  const decommissionMutation = useMutation({
    mutationFn: () => DevicesApi.decommissionDevice(params.deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      router.push('/dashboard/devices');
    }
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading device…</p>;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-red-600">Could not load device details.</CardContent>
      </Card>
    );
  }

  const { device, healthBanner, latestEvents } = data;
  const canManage = session?.role === 'Owner' || session?.role === 'Admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">{device.hostname}</CardTitle>
            <p className="text-sm text-slate-600">{device.model}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={device.status === 'online' ? 'success' : device.status === 'offline' ? 'warning' : 'danger'}>
              {device.status}
            </Badge>
            <Badge variant={device.health === 'healthy' ? 'success' : device.health === 'warning' ? 'warning' : 'danger'}>
              {device.health}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">OS</h3>
            <p className="text-sm text-slate-600">{device.osVersion}</p>
            <p className="text-sm text-slate-600">Policy {device.policyVersion}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Serial number</h3>
            <p className="text-sm text-slate-600">{device.serialNumber}</p>
            <p className="text-sm text-slate-600">Last seen {formatDate(device.lastSeen)}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Actions</h3>
            {canManage ? (
              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isLoading}>
                  {syncMutation.isLoading ? 'Triggering…' : 'Trigger sync'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => decommissionMutation.mutate()}
                  disabled={decommissionMutation.isLoading}
                >
                  {decommissionMutation.isLoading ? 'Decommissioning…' : 'Decommission device'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Auditors have read-only access.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {healthBanner && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-700">{healthBanner.message}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Installed apps</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {device.installedApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.name}</TableCell>
                  <TableCell>{app.version}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Actor</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Severity</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {latestEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatDate(event.occurredAt)}</TableCell>
                  <TableCell>{event.actor}</TableCell>
                  <TableCell>{event.action}</TableCell>
                  <TableCell>
                    <Badge variant={event.severity === 'error' ? 'danger' : event.severity === 'warning' ? 'warning' : 'default'}>
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { requestJson, postJson } from '@/lib/api/http';

export interface DeviceSummary {
  id: string;
  hostname: string;
  model: string;
  osVersion: string;
  policyVersion: string;
  health: 'healthy' | 'warning' | 'critical';
  orgId: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'decommissioned';
}

export interface DeviceDetail extends DeviceSummary {
  serialNumber: string;
  installedApps: Array<{ id: string; name: string; version: string }>;
  healthSnapshot: {
    disk: 'healthy' | 'warning' | 'critical';
    battery: 'healthy' | 'warning' | 'critical';
  };
  updates: {
    channel: string;
    lastSync: string;
    pendingVersion?: string;
  };
  events: Array<{
    id: string;
    occurredAt: string;
    actor: string;
    action: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

export interface ListDevicesRequest {
  orgId?: string;
  status?: string;
  search?: string;
  lastSeenAfter?: string;
  lastSeenBefore?: string;
}

export interface ListDevicesResponse {
  devices: DeviceSummary[];
}

export async function listDevices(params: ListDevicesRequest = {}): Promise<ListDevicesResponse> {
  return requestJson<ListDevicesResponse>('/api/devices', { params });
}

export async function getDevice(deviceId: string): Promise<DeviceDetail> {
  return requestJson<DeviceDetail>(`/api/devices/${deviceId}`);
}

export async function triggerDeviceSync(deviceId: string) {
  return postJson(`/api/devices/${deviceId}/sync`, {});
}

export async function decommissionDevice(deviceId: string) {
  return postJson(`/api/devices/${deviceId}/decommission`, {});
}

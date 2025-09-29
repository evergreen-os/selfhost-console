import type { PlainMessage } from '@bufbuild/protobuf';
import {
  DeviceCommandResponse,
  DeviceDetail as DeviceDetailMessage,
  DeviceSummary as DeviceSummaryMessage,
  ListDevicesRequest as ListDevicesRequestMessage,
  ListDevicesResponse as ListDevicesResponseMessage
} from '@gen/evergreen/console/v1/console_pb.ts';
import { deviceClient } from './transport';
import { postJson, requestJson } from '@/lib/api/http';

export type DeviceSummary = PlainMessage<DeviceSummaryMessage>;
export type DeviceDetail = PlainMessage<DeviceDetailMessage>;
export type ListDevicesRequest = Partial<PlainMessage<ListDevicesRequestMessage>>;
export type ListDevicesResponse = PlainMessage<ListDevicesResponseMessage>;
export type DeviceCommandResult = PlainMessage<DeviceCommandResponse>;

const BASE_PATH = '/api/devices';

export async function listDevices(params: ListDevicesRequest = {}): Promise<ListDevicesResponse> {
  const response = await requestJson<ListDevicesResponse>(BASE_PATH, { params });
  return response;
}

export async function getDevice(deviceId: string): Promise<DeviceDetail> {
  return requestJson<DeviceDetail>(`${BASE_PATH}/${deviceId}`);
}

async function callDeviceCommand(
  command: (input: { deviceId: string }) => Promise<DeviceCommandResponse>,
  deviceId: string,
  fallbackSuffix: string
): Promise<DeviceCommandResult> {
  try {
    const result = await command({ deviceId });
    return result;
  } catch (error) {
    await postJson(`${BASE_PATH}/${deviceId}/${fallbackSuffix}`, {});
    return { accepted: true, status: 'fallback' };
  }
}

export async function triggerDeviceSync(deviceId: string): Promise<DeviceCommandResult> {
  return callDeviceCommand(deviceClient.triggerDeviceSync.bind(deviceClient), deviceId, 'sync');
}

export async function decommissionDevice(deviceId: string): Promise<DeviceCommandResult> {
  return callDeviceCommand(deviceClient.decommissionDevice.bind(deviceClient), deviceId, 'decommission');
}

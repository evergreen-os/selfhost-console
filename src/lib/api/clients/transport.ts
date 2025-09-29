import { createPromiseClient, createConnectTransport } from '@bufbuild/connect-web';
import { DeviceService, EventService, PolicyService, TenantService, UserService } from '@gen/evergreen/console/v1/console_connect.ts';

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_GRPC_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:4000';

const transport = createConnectTransport({ baseUrl: DEFAULT_BASE_URL, useBinaryFormat: false });

export const deviceClient = createPromiseClient(DeviceService, transport);
export const policyClient = createPromiseClient(PolicyService, transport);
export const eventClient = createPromiseClient(EventService, transport);
export const userClient = createPromiseClient(UserService, transport);
export const tenantClient = createPromiseClient(TenantService, transport);

// Minimal gRPC-Web client stub to integrate with EvergreenOS backend services.
// In production this file is generated via the scripts/generate-clients.mjs script
// using the protobuf definitions from evergreen-os/shared-specs.

export interface DeviceStateRequest {
  deviceId: string;
}

export interface DeviceStateResponse {
  deviceId: string;
  status: 'online' | 'offline' | 'decommissioned';
  lastSeen: string;
}

type UnaryHandler<I, O> = (input: I) => Promise<O>;

export interface DeviceServiceClientOptions {
  host: string;
  unary: UnaryHandler<unknown, unknown>;
}

export class DeviceServiceClient {
  private readonly host: string;
  private readonly unary: UnaryHandler<unknown, unknown>;

  constructor(options: DeviceServiceClientOptions) {
    this.host = options.host;
    this.unary = options.unary;
  }

  async getDeviceState(request: DeviceStateRequest): Promise<DeviceStateResponse> {
    return (await this.unary({
      path: `${this.host}/grpc/device.DeviceService/GetDeviceState`,
      request
    })) as DeviceStateResponse;
  }
}

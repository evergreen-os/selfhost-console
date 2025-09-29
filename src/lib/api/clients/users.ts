import type { PlainMessage } from '@bufbuild/protobuf';
import {
  InviteUserRequest as InviteUserRequestMessage,
  ListUsersRequest as ListUsersRequestMessage,
  ListUsersResponse as ListUsersResponseMessage,
  UpdateUserRoleRequest as UpdateUserRoleRequestMessage,
  UserRecord as UserRecordMessage
} from '@gen/evergreen/console/v1/console_pb.ts';
import { userClient } from './transport';
import { patchJson, postJson, requestJson } from '@/lib/api/http';

export type UserRecord = PlainMessage<UserRecordMessage>;
export type ListUsersRequest = Partial<PlainMessage<ListUsersRequestMessage>>;
export type ListUsersResponse = PlainMessage<ListUsersResponseMessage>;
export type InviteUserRequest = PlainMessage<InviteUserRequestMessage>;
export type UpdateUserRoleRequest = PlainMessage<UpdateUserRoleRequestMessage>;

const BASE_PATH = '/api/users';

export async function listUsers(params: ListUsersRequest = {}): Promise<ListUsersResponse> {
  try {
    const response = await userClient.listUsers(params);
    return { users: response.users.map((user) => ({ ...user })) };
  } catch (error) {
    return requestJson<ListUsersResponse>(BASE_PATH, { params });
  }
}

export async function inviteUser(payload: InviteUserRequest): Promise<UserRecord> {
  try {
    const response = await userClient.inviteUser(payload);
    return response.user ?? { ...payload, id: '' };
  } catch (error) {
    return postJson<UserRecord>(BASE_PATH, payload);
  }
}

export async function updateUserRole(userId: string, payload: UpdateUserRoleRequest): Promise<UserRecord> {
  try {
    return await userClient.updateUserRole({ userId, role: payload.role });
  } catch (error) {
    return patchJson<UserRecord>(`${BASE_PATH}/${userId}`, payload);
  }
}

export async function deactivateUser(userId: string): Promise<UserRecord> {
  try {
    return await userClient.deactivateUser({ userId });
  } catch (error) {
    return postJson<UserRecord>(`${BASE_PATH}/${userId}/deactivate`, {});
  }
}

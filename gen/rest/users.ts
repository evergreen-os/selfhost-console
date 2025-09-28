import { requestJson, postJson, patchJson } from '@/lib/api/http';

export interface UserRecord {
  id: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Auditor';
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  role: 'Owner' | 'Admin' | 'Auditor';
}

export interface UpdateUserRoleRequest {
  role: 'Owner' | 'Admin' | 'Auditor';
}

export async function listUsers(orgId?: string): Promise<{ users: UserRecord[] }> {
  return requestJson<{ users: UserRecord[] }>('/api/users', { params: { orgId } });
}

export async function inviteUser(input: InviteUserRequest) {
  return postJson<UserRecord>('/api/users', input);
}

export async function updateUserRole(userId: string, input: UpdateUserRoleRequest) {
  return patchJson<UserRecord>(`/api/users/${userId}`, input);
}

export async function deactivateUser(userId: string) {
  return postJson(`/api/users/${userId}/deactivate`, {});
}

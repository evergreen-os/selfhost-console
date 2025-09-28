import { requestJson, postJson } from '@/lib/api/http';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  role: 'Owner' | 'Admin' | 'Auditor';
  expiresAt: string;
  email?: string;
  tenantId?: string;
}

export const authClient = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return postJson<AuthResponse>('/auth/login', credentials, { baseUrl: process.env.BACKEND_URL });
  },
  async refresh(refreshToken: string): Promise<AuthResponse> {
    return postJson<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
      { baseUrl: process.env.BACKEND_URL }
    );
  },
  async session(): Promise<AuthResponse | null> {
    return requestJson<AuthResponse>('/auth/session', { baseUrl: process.env.BACKEND_URL });
  },
  async logout(): Promise<void> {
    await postJson('/auth/logout', {}, { baseUrl: process.env.BACKEND_URL });
  }
};

import type { AdminCredentials } from '../globals';

export function setAdminCredentials(credentials: AdminCredentials): void {
  global.__ADMIN_CREDENTIALS__ = credentials;
}

export function getAdminCredentials(): AdminCredentials | null {
  return global.__ADMIN_CREDENTIALS__ ?? null;
}

export function getAdminAccessToken(): string | null {
  const credentials = getAdminCredentials();
  return credentials?.access_token ?? null;
}

export function addBearerToken(headers: Record<string, string> = {}): Record<string, string> {
  const token = getAdminAccessToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
}

export function addAdminAuth(headers: Record<string, string> = {}): Record<string, string> {
  return addBearerToken({
    'Content-Type': 'application/json',
    ...headers
  });
}

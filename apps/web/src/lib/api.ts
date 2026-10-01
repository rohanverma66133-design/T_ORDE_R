import type { ApiResponse } from '@tord/types';
import { env } from './env';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tord_access_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tord_access_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tord_access_token');
    localStorage.removeItem('tord_refresh_token');
  }
}

function getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: unknown) {
    const errorObj = err as Error;
    if (errorObj?.name === 'TypeError' || errorObj?.message?.includes('Failed to fetch')) {
      throw new ApiClientError(
        `Unable to connect to backend API server. Please ensure NestJS is running on port 3001.`,
        0,
        'NETWORK_ERROR',
      );
    }
    throw err;
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  let payload: ApiResponse<T>;

  try {
    const rawText = await response.text();
    if (!rawText.trim() || rawText.trim().startsWith('<') || !contentType.includes('application/json')) {
      if (rawText.trim().startsWith('<')) {
        throw new ApiClientError(
          `Server returned HTML (Status ${response.status}). Please verify API backend is running.`,
          response.status,
          'HTML_RESPONSE',
        );
      }
    }
    payload = JSON.parse(rawText) as ApiResponse<T>;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError(
      `Unable to parse API response (Status ${response.status}). Ensure backend server is running.`,
      response.status,
      'JSON_PARSE_ERROR',
    );
  }

  if (!payload.success) {
    throw new ApiClientError(payload.error?.message || 'API request failed', response.status, payload.error?.code);
  }
  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await safeFetch(`${env.apiBaseUrl}${path}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return parseApiResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await safeFetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const response = await safeFetch(`${env.apiBaseUrl}${path}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await safeFetch(`${env.apiBaseUrl}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return parseApiResponse<T>(response);
}

export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const token = getAuthToken();
  const response = await safeFetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  return parseApiResponse<T>(response);
}
const API_BASE = 'http://localhost:3001/api';

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return res.json();
}

export const api = {
  getRooms: () => fetchApi<import('./types').Room[]>('/rooms'),
  getRoom: (id: string) => fetchApi<import('./types').Room>(`/rooms/${id}`),
  getUserProfile: (id: string) => fetchApi<import('./types').User>(`/users/${id}`),
  getUserStats: (id: string) => fetchApi<import('./types').User>(`/users/${id}/stats`),
  getLeaderboard: () => fetchApi<import('./types').User[]>('/leaderboard'),
  healthCheck: () => fetchApi<{ status: string }>('/health'),
};

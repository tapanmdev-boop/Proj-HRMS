// src/api/config.ts

// Base URL for API requests
export const API_BASE_URL = 'http://localhost:3000';

// Helper function for API requests
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) => 
      fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) => 
      fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
  },
  
  // User endpoints
  users: {
    getAll: () => fetchApi('/api/users'),
    getById: (id: string) => fetchApi(`/api/users/${id}`),
  },
  
  // Employee endpoints
  employees: {
    getAll: () => fetchApi('/api/employees'),
    getById: (id: string) => fetchApi(`/api/employees/${id}`),
  },
};

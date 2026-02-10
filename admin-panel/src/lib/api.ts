import {
  LoginResponse,
  DashboardStats,
  Property,
  PropertyFormData,
  User,
  Inquiry,
  PaginatedResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8081/api/admin';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(response);
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  }
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/dashboard/stats`, {
    headers: getHeaders(),
  });
  return handleResponse<DashboardStats>(response);
}

// Properties
export async function getProperties(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  property_type?: string;
  listing_type?: string;
  status?: string;
}): Promise<PaginatedResponse<Property>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.property_type) searchParams.set('property_type', params.property_type);
  if (params?.listing_type) searchParams.set('listing_type', params.listing_type);
  if (params?.status) searchParams.set('status', params.status);

  const response = await fetch(`${API_URL}/properties?${searchParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<PaginatedResponse<Property>>(response);
}

export async function getProperty(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<Property>(response);
}

export async function createProperty(data: PropertyFormData): Promise<Property> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Property>(response);
}

export async function updateProperty(id: string, data: Partial<PropertyFormData>): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Property>(response);
}

export async function deleteProperty(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

export async function toggleFeatured(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${id}/toggle-featured`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return handleResponse<Property>(response);
}

// Users
export async function getUsers(params?: {
  page?: number;
  per_page?: number;
  role?: string;
}): Promise<PaginatedResponse<User>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.role) searchParams.set('role', params.role);

  const response = await fetch(`${API_URL}/users?${searchParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<PaginatedResponse<User>>(response);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<User> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; email: string; role: string }>
): Promise<User> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function toggleUserActive(id: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/${id}/toggle-active`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return handleResponse<User>(response);
}

// Inquiries
export async function getInquiries(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<PaginatedResponse<Inquiry>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.status) searchParams.set('status', params.status);

  const response = await fetch(`${API_URL}/inquiries?${searchParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<PaginatedResponse<Inquiry>>(response);
}

export async function updateInquiryStatus(id: string, status: string): Promise<Inquiry> {
  const response = await fetch(`${API_URL}/inquiries/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<Inquiry>(response);
}

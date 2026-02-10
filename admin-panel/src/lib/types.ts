export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'editor';
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: 'villa' | 'house' | 'apartment' | 'land' | 'commercial';
  listing_type: 'sale' | 'rent' | 'lease';
  price: number;
  currency: string;
  price_period?: string;
  bedrooms: number;
  bathrooms: number;
  land_size: number;
  building_size: number;
  area: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  currency: string;
  price_period: string;
  bedrooms: number;
  bathrooms: number;
  land_size: number;
  building_size: number;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  features: string[];
  is_featured: boolean;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'agent' | 'admin' | 'super_admin';
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  property_id: string;
  property_title: string;
  property_image?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_properties: number;
  active_listings: number;
  total_users: number;
  new_inquiries: number;
  properties_by_type: Record<string, number>;
  properties_by_area: Record<string, number>;
  recent_inquiries: Inquiry[];
  recent_properties: Property[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

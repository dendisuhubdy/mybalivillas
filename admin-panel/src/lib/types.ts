export type AdminRole = 'super_admin' | 'admin' | 'operational';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/** Whether this role can access the Users management page. */
export function canManageUsers(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

/** Whether this role can delete properties. */
export function canDeleteProperties(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

/** Returns the roles that the given caller role is allowed to assign. */
export function assignableRoles(callerRole: AdminRole): string[] {
  switch (callerRole) {
    case 'super_admin':
      return ['super_admin', 'admin', 'operational', 'agent', 'user'];
    case 'admin':
      return ['operational', 'agent', 'user'];
    default:
      return [];
  }
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
  role: 'user' | 'agent' | 'admin' | 'super_admin' | 'operational';
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
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface AdminBooking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  special_requests?: string;
  base_price: number;
  cleaning_fee?: number;
  service_fee?: number;
  total_price: number;
  currency: string;
  duration_type: string;
  duration_count: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'refunded';
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminReview {
  id: string;
  property_id: string;
  booking_id?: string;
  user_id: string;
  overall_rating: number;
  cleanliness_rating?: number;
  location_rating?: number;
  value_rating?: number;
  communication_rating?: number;
  title?: string;
  comment: string;
  owner_response?: string;
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

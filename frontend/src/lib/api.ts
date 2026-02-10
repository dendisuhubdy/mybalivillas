import {
  Property,
  PropertyFilters,
  Area,
  Inquiry,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  PaginatedResponse,
  User,
  PropertyType,
  ListingType,
  PricePeriod,
  PropertyStatus,
} from './types';
import { buildQueryString } from './utils';

// ============================================================================
// Configuration
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ============================================================================
// Fetch Helper
// ============================================================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================================
// Property Endpoints
// ============================================================================

export async function getProperties(
  filters?: PropertyFilters
): Promise<ApiResponse<PaginatedResponse<Property>>> {
  const queryString = filters ? buildQueryString(filters as Record<string, string | number | boolean | undefined>) : '';
  return fetchApi<ApiResponse<PaginatedResponse<Property>>>(`/properties${queryString}`);
}

export async function getFeaturedProperties(): Promise<ApiResponse<Property[]>> {
  return fetchApi<ApiResponse<Property[]>>('/properties/featured');
}

export async function getPropertyBySlug(slug: string): Promise<ApiResponse<Property>> {
  return fetchApi<ApiResponse<Property>>(`/properties/${slug}`);
}

export async function getSimilarProperties(
  propertyId: string
): Promise<ApiResponse<Property[]>> {
  return fetchApi<ApiResponse<Property[]>>(`/properties/${propertyId}/similar`);
}

// ============================================================================
// Area Endpoints
// ============================================================================

export async function getAreas(): Promise<ApiResponse<Area[]>> {
  return fetchApi<ApiResponse<Area[]>>('/properties/areas');
}

// ============================================================================
// Auth Endpoints
// ============================================================================

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<ApiResponse<AuthResponse>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password } as LoginRequest),
  });
}

export async function register(
  data: RegisterRequest
): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<ApiResponse<AuthResponse>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<ApiResponse<User>> {
  return fetchApi<ApiResponse<User>>('/auth/profile', {
    headers: getAuthHeaders(),
  });
}

// ============================================================================
// Inquiry Endpoints
// ============================================================================

export async function submitInquiry(
  propertyId: string,
  data: Omit<Inquiry, 'id' | 'property_id' | 'created_at'>
): Promise<ApiResponse<Inquiry>> {
  return fetchApi<ApiResponse<Inquiry>>(`/properties/${propertyId}/inquiries`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Saved Properties Endpoints
// ============================================================================

export async function getSavedProperties(): Promise<ApiResponse<Property[]>> {
  return fetchApi<ApiResponse<Property[]>>('/saved-properties', {
    headers: getAuthHeaders(),
  });
}

export async function saveProperty(id: string): Promise<ApiResponse<null>> {
  return fetchApi<ApiResponse<null>>(`/saved-properties/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function unsaveProperty(id: string): Promise<ApiResponse<null>> {
  return fetchApi<ApiResponse<null>>(`/saved-properties/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

// ============================================================================
// Mock Data (Fallback when API is unavailable)
// ============================================================================

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    slug: 'luxury-beachfront-villa-seminyak',
    title: 'Luxury Beachfront Villa in Seminyak',
    description: 'Stunning 4-bedroom villa with private pool and direct beach access. This magnificent property features modern Balinese architecture, open-plan living areas, and breathtaking ocean views. Perfect for those seeking the ultimate tropical lifestyle in one of Bali\'s most sought-after locations.',
    property_type: PropertyType.VILLA,
    listing_type: ListingType.BUY_FREEHOLD,
    status: PropertyStatus.ACTIVE,
    price: 850000,
    currency: 'USD',
    bedrooms: 4,
    bathrooms: 4,
    land_size: 600,
    building_size: 450,
    land_size_unit: 'sqm',
    building_size_unit: 'sqm',
    address: 'Jl. Kayu Aya, Seminyak',
    area: 'Seminyak',
    city: 'Badung',
    features: ['Private Pool', 'Beach Access', 'Garden', 'Parking', 'Security', 'Furnished'],
    images: [
      { id: '1', url: '', alt: 'Villa exterior', is_primary: true, order: 0 },
      { id: '2', url: '', alt: 'Pool area', is_primary: false, order: 1 },
      { id: '3', url: '', alt: 'Living room', is_primary: false, order: 2 },
      { id: '4', url: '', alt: 'Bedroom', is_primary: false, order: 3 },
    ],
    agent: {
      id: 'a1',
      name: 'Sarah Johnson',
      email: 'sarah@mybalivilla.com',
      phone: '+62 812 3456 7890',
      properties_count: 24,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 342,
  },
  {
    id: '2',
    slug: 'modern-villa-canggu-berawa',
    title: 'Modern 3BR Villa in Canggu Berawa',
    description: 'Beautiful modern villa in the heart of Canggu, close to Berawa Beach. Features a stunning infinity pool, rooftop terrace, and contemporary design throughout.',
    property_type: PropertyType.VILLA,
    listing_type: ListingType.RENT_LONG_TERM,
    status: PropertyStatus.ACTIVE,
    price: 35000000,
    currency: 'IDR',
    price_period: PricePeriod.PER_MONTH,
    bedrooms: 3,
    bathrooms: 3,
    land_size: 350,
    building_size: 280,
    land_size_unit: 'sqm',
    building_size_unit: 'sqm',
    address: 'Jl. Pantai Berawa, Canggu',
    area: 'Canggu',
    city: 'Badung',
    features: ['Private Pool', 'Rooftop Terrace', 'Fully Furnished', 'WiFi', 'AC'],
    images: [
      { id: '5', url: '', alt: 'Villa front', is_primary: true, order: 0 },
      { id: '6', url: '', alt: 'Pool', is_primary: false, order: 1 },
    ],
    agent: {
      id: 'a2',
      name: 'Made Wijaya',
      email: 'made@mybalivilla.com',
      phone: '+62 813 5678 9012',
      properties_count: 18,
    },
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-05T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 256,
  },
  {
    id: '3',
    slug: 'tropical-retreat-ubud-rice-fields',
    title: 'Tropical Retreat Overlooking Rice Fields in Ubud',
    description: 'Escape to this serene 2-bedroom villa nestled among Ubud\'s iconic rice terraces. Traditional Balinese architecture meets modern comfort with an open-air living pavilion.',
    property_type: PropertyType.VILLA,
    listing_type: ListingType.RENT_SHORT_TERM,
    status: PropertyStatus.ACTIVE,
    price: 2500000,
    currency: 'IDR',
    price_period: PricePeriod.PER_DAY,
    bedrooms: 2,
    bathrooms: 2,
    land_size: 400,
    building_size: 200,
    land_size_unit: 'sqm',
    building_size_unit: 'sqm',
    address: 'Jl. Raya Tegallalang, Ubud',
    area: 'Ubud',
    city: 'Gianyar',
    features: ['Rice Field View', 'Private Pool', 'Yoga Deck', 'Breakfast Included', 'WiFi'],
    images: [
      { id: '7', url: '', alt: 'Rice field view', is_primary: true, order: 0 },
    ],
    agent: {
      id: 'a3',
      name: 'Ketut Sari',
      email: 'ketut@mybalivilla.com',
      phone: '+62 817 8901 2345',
      properties_count: 12,
    },
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 189,
  },
  {
    id: '4',
    slug: 'ocean-view-apartment-uluwatu',
    title: 'Ocean View Apartment in Uluwatu',
    description: 'Stunning 1-bedroom apartment with panoramic ocean views in the prestigious Uluwatu cliff area. Modern finishes, communal pool, and world-class surfing at your doorstep.',
    property_type: PropertyType.APARTMENT,
    listing_type: ListingType.BUY_FREEHOLD,
    status: PropertyStatus.ACTIVE,
    price: 195000,
    currency: 'USD',
    bedrooms: 1,
    bathrooms: 1,
    building_size: 65,
    building_size_unit: 'sqm',
    address: 'Jl. Labuansait, Uluwatu',
    area: 'Uluwatu',
    city: 'Badung',
    features: ['Ocean View', 'Communal Pool', 'Gym', 'Security 24/7', 'Parking'],
    images: [
      { id: '8', url: '', alt: 'Apartment view', is_primary: true, order: 0 },
    ],
    agent: {
      id: 'a1',
      name: 'Sarah Johnson',
      email: 'sarah@mybalivilla.com',
      phone: '+62 812 3456 7890',
      properties_count: 24,
    },
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-12T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 415,
  },
  {
    id: '5',
    slug: 'prime-land-nusa-dua',
    title: 'Prime Development Land in Nusa Dua',
    description: 'Excellent 2,000 sqm freehold land in Nusa Dua\'s prime tourism zone. Perfect for resort or villa development with easy access to beaches and international hotels.',
    property_type: PropertyType.LAND,
    listing_type: ListingType.BUY_FREEHOLD,
    status: PropertyStatus.ACTIVE,
    price: 1200000,
    currency: 'USD',
    land_size: 2000,
    land_size_unit: 'sqm',
    address: 'BTDC Area, Nusa Dua',
    area: 'Nusa Dua',
    city: 'Badung',
    features: ['Freehold', 'Flat Terrain', 'Road Access', 'Electricity', 'Water'],
    images: [
      { id: '9', url: '', alt: 'Land plot', is_primary: true, order: 0 },
    ],
    agent: {
      id: 'a2',
      name: 'Made Wijaya',
      email: 'made@mybalivilla.com',
      phone: '+62 813 5678 9012',
      properties_count: 18,
    },
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 523,
  },
  {
    id: '6',
    slug: 'charming-family-house-sanur',
    title: 'Charming Family House in Sanur',
    description: 'Spacious 3-bedroom family home in peaceful Sanur. Featuring a large garden, covered terrace, modern kitchen, and close proximity to the beach promenade and international schools.',
    property_type: PropertyType.HOUSE,
    listing_type: ListingType.RENT_LONG_TERM,
    status: PropertyStatus.ACTIVE,
    price: 25000000,
    currency: 'IDR',
    price_period: PricePeriod.PER_MONTH,
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    building_size: 220,
    land_size_unit: 'sqm',
    building_size_unit: 'sqm',
    address: 'Jl. Danau Tamblingan, Sanur',
    area: 'Sanur',
    city: 'Denpasar',
    features: ['Garden', 'Garage', 'Furnished', 'Near Beach', 'Near Schools'],
    images: [
      { id: '10', url: '', alt: 'House exterior', is_primary: true, order: 0 },
    ],
    agent: {
      id: 'a3',
      name: 'Ketut Sari',
      email: 'ketut@mybalivilla.com',
      phone: '+62 817 8901 2345',
      properties_count: 12,
    },
    created_at: '2024-02-08T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
    is_featured: true,
    is_verified: true,
    views_count: 178,
  },
];

export const MOCK_AREAS: Area[] = [
  { id: '1', name: 'Seminyak', slug: 'seminyak', description: 'Trendy beachside area known for upscale dining and nightlife', property_count: 245 },
  { id: '2', name: 'Canggu', slug: 'canggu', description: 'Surf-centric village with rice paddies and hip cafes', property_count: 312 },
  { id: '3', name: 'Ubud', slug: 'ubud', description: 'Cultural heart of Bali with lush rice terraces and art', property_count: 189 },
  { id: '4', name: 'Uluwatu', slug: 'uluwatu', description: 'Dramatic clifftop area with world-class surf breaks', property_count: 156 },
  { id: '5', name: 'Sanur', slug: 'sanur', description: 'Relaxed coastal town popular with families and expats', property_count: 134 },
  { id: '6', name: 'Nusa Dua', slug: 'nusa-dua', description: 'Exclusive resort enclave with pristine beaches', property_count: 98 },
  { id: '7', name: 'Jimbaran', slug: 'jimbaran', description: 'Famous for seafood restaurants and sunset views', property_count: 87 },
  { id: '8', name: 'Kuta', slug: 'kuta', description: 'Bustling tourist hub near the airport', property_count: 176 },
];

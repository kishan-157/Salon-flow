import {
  Tenant,
  Service,
  GalleryItem,
  Booking,
  Review,
  SubscriptionRenewal,
  AuditLog,
  PlanDefinition,
  RoyalThemeId,
} from '../types/saas.ts';

const TOKEN_KEY = 'glamhub_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const saasApi = {
  // Public
  resolveTenant: (querySlug?: string) => {
    const url = querySlug ? `/api/public/tenant-resolve?tenant=${encodeURIComponent(querySlug)}` : '/api/public/tenant-resolve';
    return request<any>(url);
  },

  getPublicTenant: (slug: string) => {
    return request<{
      tenant: Tenant;
      services: Service[];
      gallery: GalleryItem[];
      reviews: Review[];
    }>(`/api/public/tenants/${encodeURIComponent(slug)}`);
  },

  bookAppointment: (slug: string, bookingData: {
    service_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    appointment_date: string;
    appointment_time: string;
    customer_notes?: string;
  }) => {
    return request<{
      success: boolean;
      message: string;
      booking: any;
    }>(`/api/public/tenants/${encodeURIComponent(slug)}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Auth
  login: async (email: string, password: string) => {
    const res = await request<{
      token: string;
      user: any;
      tenant: Tenant | null;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  loginWithFirebase: async (payload: {
    uid: string;
    email: string;
    displayName?: string | null;
    preferredRole?: 'superadmin' | 'owner';
    targetTenantSlug?: string;
  }) => {
    const res = await request<{
      token: string;
      user: any;
      tenant: Tenant | null;
    }>('/api/auth/firebase', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  getCurrentUser: () => {
    return request<{ user: any; tenant: Tenant | null }>('/api/auth/me');
  },

  logout: () => {
    clearStoredToken();
  },

  // Owner
  getOwnerDashboard: (tenantId: string) => {
    return request<{
      tenant: Tenant;
      todayBookings: Booking[];
      stats: {
        todayAppointments: number;
        pendingRequests: number;
        upcomingAppointments: number;
        totalCompleted: number;
        estimatedRevenue: number;
      };
    }>(`/api/owner/${tenantId}/dashboard`);
  },

  getOwnerBookings: (tenantId: string, params?: { status?: string; date?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.date) searchParams.set('date', params.date);
    if (params?.search) searchParams.set('search', params.search);
    return request<Booking[]>(`/api/owner/${tenantId}/bookings?${searchParams.toString()}`);
  },

  updateBookingStatus: (tenantId: string, bookingId: string, status: string, internalNotes?: string) => {
    return request<{ success: boolean; message: string; booking: Booking }>(
      `/api/owner/${tenantId}/bookings/${bookingId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, internal_notes: internalNotes }),
      }
    );
  },

  getOwnerServices: (tenantId: string) => {
    return request<Service[]>(`/api/owner/${tenantId}/services`);
  },

  createService: (tenantId: string, serviceData: Partial<Service>) => {
    return request<Service>(`/api/owner/${tenantId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  updateService: (tenantId: string, serviceId: string, serviceData: Partial<Service>) => {
    return request<Service>(`/api/owner/${tenantId}/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  },

  deleteService: (tenantId: string, serviceId: string) => {
    return request<{ success: boolean; message: string }>(`/api/owner/${tenantId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  getOwnerGallery: (tenantId: string) => {
    return request<GalleryItem[]>(`/api/owner/${tenantId}/gallery`);
  },

  createGalleryItem: (tenantId: string, itemData: { title: string; category: string; image_url: string }) => {
    return request<GalleryItem>(`/api/owner/${tenantId}/gallery`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  updateGalleryItem: (tenantId: string, galleryId: string, itemData: { title?: string; category?: string; image_url?: string }) => {
    return request<GalleryItem>(`/api/owner/${tenantId}/gallery/${galleryId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  deleteGalleryItem: (tenantId: string, galleryId: string) => {
    return request<{ success: boolean; message: string }>(`/api/owner/${tenantId}/gallery/${galleryId}`, {
      method: 'DELETE',
    });
  },

  getOwnerReviews: (tenantId: string) => {
    return request<Review[]>(`/api/owner/${tenantId}/reviews`);
  },

  createReview: (tenantId: string, reviewData: {
    author_name: string;
    rating: number;
    comment: string;
    service_tag?: string;
    date?: string;
  }) => {
    return request<Review>(`/api/owner/${tenantId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: (tenantId: string, reviewId: string) => {
    return request<{ success: boolean; message: string }>(`/api/owner/${tenantId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },

  updateOwnerSettings: (tenantId: string, settings: any, name?: string) => {
    return request<{ success: boolean; message: string; settings?: any }>(`/api/owner/${tenantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings, name }),
    });
  },

  updateOwnerTheme: (tenantId: string, themeId: RoyalThemeId) => {
    return request<{
      success: boolean;
      themeId: RoyalThemeId;
      themeName: string;
      message: string;
      settings: any;
    }>(`/api/owner/${tenantId}/theme`, {
      method: 'PATCH',
      body: JSON.stringify({ themeId }),
    });
  },

  // Super Admin
  getAdminOverview: () => {
    return request<{
      totalTenants: number;
      activeTenants: number;
      suspendedTenants: number;
      expiredTenants: number;
      totalBookings: number;
      confirmedBookings: number;
      totalRevenueCollected: number;
    }>('/api/admin/overview');
  },

  getAdminTenants: (params?: { search?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    return request<Tenant[]>(`/api/admin/tenants?${searchParams.toString()}`);
  },

  createTenant: (data: {
    name: string;
    slug: string;
    owner_name: string;
    owner_email: string;
    owner_password: string;
    plan_id: string;
    theme_id?: RoyalThemeId;
  }) => {
    return request<{ success: boolean; message: string; tenantId: string; slug: string }>('/api/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTenantCredentials: (
    tenantId: string,
    data: {
      owner_name?: string;
      owner_email?: string;
      owner_password?: string;
      theme_id?: RoyalThemeId;
    }
  ) => {
    return request<{ success: boolean; message: string }>(`/api/admin/tenants/${tenantId}/credentials`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateTenantStatus: (tenantId: string, status: 'active' | 'suspended', reason?: string) => {
    return request<{ success: boolean; message: string }>(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  renewSubscription: (tenantId: string, data: {
    plan_name: string;
    amount: number;
    period_months: number;
    notes?: string;
    starts_at?: string;
  }) => {
    return request<{ success: boolean; message: string; renewalId: string; expires_at: string }>(
      `/api/admin/tenants/${tenantId}/renew`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  updateTenantPlan: (tenantId: string, plan_id: string) => {
    return request<{ success: boolean; message: string }>(`/api/admin/tenants/${tenantId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan_id }),
    });
  },

  getTenantRenewals: (tenantId: string) => {
    return request<SubscriptionRenewal[]>(`/api/admin/tenants/${tenantId}/renewals`);
  },

  getAdminAuditLogs: () => {
    return request<AuditLog[]>('/api/admin/audit-logs');
  },

  getAdminPlans: () => {
    return request<PlanDefinition[]>('/api/admin/plans');
  },
};

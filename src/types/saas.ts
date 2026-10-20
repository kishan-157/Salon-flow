export type TenantStatus = 'active' | 'suspended' | 'pending';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended';
export type UserRole = 'superadmin' | 'owner' | 'staff';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
export type RoyalThemeId =
  | 'royal-gold'
  | 'rose-elegance'
  | 'bridal-royale'
  | 'emerald-luxe'
  | 'mocha-signature'
  | 'rose-luxe';

export interface OpeningHour {
  day: string; // 'Monday', 'Tuesday', etc.
  isOpen: boolean;
  openTime: string; // '09:00'
  closeTime: string; // '19:00'
}

export interface CustomThemeColors {
  canvasBg?: string;
  surfaceBg?: string;
  heroBg?: string;
  heroText?: string;
  textPrimary?: string;
  accentPrimary?: string;
  accentSecondary?: string;
  buttonBg?: string;
  buttonText?: string;
  footerBg?: string;
}

export interface TenantSettings {
  themeId?: RoyalThemeId;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  mapEmbedUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl?: string;
  logoUrl?: string;
  showLogo?: boolean;
  aboutImageUrl?: string;
  currency: string;
  noticeBanner?: string;
  showNoticeBanner?: boolean;

  // Typography & Letter Customization
  headingFont?: string;
  bodyFont?: string;
  letterSpacingStyle?: 'normal' | 'wide' | 'editorial';

  // Layout & Section Visibility Customization
  layoutVariant?:
    | 'editorial-noir'
    | 'parisian-split'
    | 'regal-arch'
    | 'botanical-grid'
    | 'architectural-minimal'
    | 'rose-luxe-pink';
  serviceCardStyle?: 'bordered' | 'editorial-row' | 'framed' | 'photo-card';
  sectionOrder?: string[];
  showStatsStrip?: boolean;
  showWhyChooseUs?: boolean;
  showAboutSection?: boolean;
  showGallerySection?: boolean;
  showReviewsSection?: boolean;
  showHoursSection?: boolean;
  showAllCategoryTab?: boolean;

  // Custom Color Palette Overrides (on top of base Royal Theme)
  customColors?: CustomThemeColors;

  // All Custom Text & Button Labels
  navServicesLabel?: string;
  navGalleryLabel?: string;
  navReviewsLabel?: string;
  navHoursLabel?: string;
  headerCtaText?: string;
  heroPrimaryBtnText?: string;
  heroSecondaryBtnText?: string;

  // Custom Stats Strip Text
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
  stat4Value?: string;
  stat4Label?: string;

  // About / Story Section Text
  aboutKicker?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutDescription2?: string;
  aboutHighlight1?: string;
  aboutHighlight2?: string;
  aboutExpYears?: string;
  aboutExpLabel?: string;
  aboutStat1Value?: string;
  aboutStat1Label?: string;
  aboutStat2Value?: string;
  aboutStat2Label?: string;
  aboutStat3Value?: string;
  aboutStat3Label?: string;
  aboutBtnText?: string;

  // Section Headings & Labels
  servicesKicker?: string;
  servicesHeading?: string;
  servicesSubheading?: string;
  serviceBookBtnText?: string;
  whyChooseUsKicker?: string;
  whyChooseUsHeading?: string;
  whyChooseUsSubheading?: string;
  whyChooseUsCards?: Array<{
    title: string;
    desc: string;
  }>;
  galleryKicker?: string;
  galleryHeading?: string;
  gallerySubheading?: string;
  reviewsKicker?: string;
  reviewsHeading?: string;
  hoursHeading?: string;
  hoursSubheading?: string;
  contactHeading?: string;
  footerTagline?: string;

  openingHours: OpeningHour[];
  servicePhotos?: Record<string, string>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  status: TenantStatus;
  plan_id: string;
  subscription_status: SubscriptionStatus;
  subscription_starts_at: string;
  subscription_expires_at: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
  // Computed fields for display
  owner_name?: string;
  owner_email?: string;
  services_count?: number;
  bookings_count?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant_id: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  status: BookingStatus;
  customer_notes: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  // Join fields
  service_name?: string;
  service_price?: number;
  service_duration?: number;
  service_category?: string;
}

export interface Review {
  id: string;
  tenant_id: string;
  author_name: string;
  rating: number;
  comment: string;
  service_tag: string;
  date: string;
  is_verified: boolean;
}

export interface SubscriptionRenewal {
  id: string;
  tenant_id: string;
  plan_name: string;
  amount: number;
  period_months: number;
  starts_at: string;
  expires_at: string;
  recorded_by: string;
  notes: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  maxServices: number;
  maxGalleryItems: number;
  customDomainSupport: boolean;
  prioritySupport: boolean;
  description: string;
  features: string[];
}

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Instagram,
  Facebook,
  X,
  ChevronRight,
  Loader2,
  Crown,
  Sparkles,
  Clock,
  Heart,
  Award,
  Users,
  MessageCircle,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import { saasApi } from '../services/api.ts';
import {
  Tenant,
  Service,
  GalleryItem,
  Review,
  RoyalThemeId,
  TenantSettings,
} from '../types/saas.ts';
import {
  ROYAL_THEMES,
  ROYAL_THEME_LIST,
  resolveSafeThemeId,
  getGalleryArtworkDataUri,
  getRoseLuxeSalonHeroUri,
  getThemeHeroBackdropUri,
  isDefaultOrPresetHeroImage,
  RoyalThemeTokens,
} from '../config/themes.ts';
import { INDIAN_SALON_PHOTO_LIBRARY } from '../config/indianPhotoLibrary.ts';

export type EditableWebsiteSectionId =
  | 'announcement'
  | 'header'
  | 'hero'
  | 'stats'
  | 'services'
  | 'why-choose-us'
  | 'about'
  | 'gallery'
  | 'reviews'
  | 'hours'
  | 'footer';

export const DEFAULT_SECTION_ORDER: EditableWebsiteSectionId[] = [
  'services',
  'why-choose-us',
  'about',
  'gallery',
  'reviews',
  'hours',
];

// Clean, brand-neutral fallback salon data for instant theme previews & marketing links
const FALLBACK_PREVIEW_SERVICES: Service[] = [
  {
    id: 'svc_prev_1',
    tenant_id: 'preview',
    category: 'Bridal & Styling',
    name: 'Signature Royal Bridal Makeup & Hair Styling',
    description:
      'Complete HD / Airbrush bridal makeup, traditional hair styling with floral gajra, and saree/lehenga draping.',
    price: 14999,
    duration_minutes: 150,
    is_active: true,
    is_popular: true,
    created_at: '',
  },
  {
    id: 'svc_prev_2',
    tenant_id: 'preview',
    category: 'Facial & Skin',
    name: '24K Gold & Kashmiri Saffron Glow Facial',
    description:
      'Deep cellular rejuvenation with pure 24K gold leaf, Kumkumadi tailam massage, and ultrasonic hydration.',
    price: 2499,
    duration_minutes: 75,
    is_active: true,
    is_popular: true,
    created_at: '',
  },
  {
    id: 'svc_prev_3',
    tenant_id: 'preview',
    category: 'Hair & Styling',
    name: 'Keratin Silk Smooth & Moroccan Hair Spa',
    description:
      'Frizz-free keratin protein infusion paired with deep argan oil steam therapy for mirror-like shine.',
    price: 3499,
    duration_minutes: 120,
    is_active: true,
    is_popular: true,
    created_at: '',
  },
  {
    id: 'svc_prev_4',
    tenant_id: 'preview',
    category: 'Sangeet & Party',
    name: 'Sangeet, Reception & Engagement Glam Look',
    description:
      'Soft smokey eyes, dewy glass-skin finish, and couture waves crafted for festive wedding celebrations.',
    price: 4999,
    duration_minutes: 90,
    is_active: true,
    is_popular: false,
    created_at: '',
  },
  {
    id: 'svc_prev_5',
    tenant_id: 'preview',
    category: 'Nail Lounge',
    name: 'Luxury Gel Nail Extensions & Rose Spa Pedicure',
    description:
      'Custom French/bridal nail art extensions with organic rose-petal foot soak and massage.',
    price: 1899,
    duration_minutes: 75,
    is_active: true,
    is_popular: false,
    created_at: '',
  },
  {
    id: 'svc_prev_6',
    tenant_id: 'preview',
    category: 'Facial & Skin',
    name: 'Hydra-Glow Korean Glass Skin Treatment',
    description:
      'Multi-step aqua peel, hyaluronic serum infusion, and LED light therapy for instant luminosity.',
    price: 2999,
    duration_minutes: 60,
    is_active: true,
    is_popular: false,
    created_at: '',
  },
];

const FALLBACK_PREVIEW_GALLERY: GalleryItem[] = INDIAN_SALON_PHOTO_LIBRARY.slice(0, 6).map((preset, idx) => ({
  id: `gal_prev_${idx + 1}`,
  tenant_id: 'preview',
  title: preset.title,
  category: preset.category,
  image_url: preset.imageUrl,
  created_at: '',
}));

const FALLBACK_PREVIEW_REVIEWS: Review[] = [
  {
    id: 'rev_prev_1',
    tenant_id: 'preview',
    author_name: 'Priya Sharma',
    rating: 5,
    comment:
      'My bridal makeup and hair styling were beyond perfection! Every guest complimented the natural royal glow.',
    service_tag: 'Bridal Makeup',
    date: '2026-10-12',
    is_verified: true,
  },
  {
    id: 'rev_prev_2',
    tenant_id: 'preview',
    author_name: 'Ananya Patel',
    rating: 5,
    comment:
      'Super hygienic salon with a calm, luxurious ambiance. The 24K Gold facial and hair spa gave instant results.',
    service_tag: 'Facial & Skin',
    date: '2026-10-08',
    is_verified: true,
  },
  {
    id: 'rev_prev_3',
    tenant_id: 'preview',
    author_name: 'Meera Kapoor',
    rating: 5,
    comment:
      'Punctual appointments, polite staff, and genuine branded products. Highly recommend for bridal & party looks!',
    service_tag: 'Hair & Styling',
    date: '2026-10-02',
    is_verified: true,
  },
];

interface PublicSalonSiteProps {
  slug: string;
  onOpenOwnerLogin?: () => void;
  overrideThemeId?: RoyalThemeId;
  overrideSettings?: Partial<TenantSettings>;
  overrideSalonName?: string;
  overrideServices?: Service[];
  overrideGallery?: GalleryItem[];
  previewMode?: 'desktop' | 'mobile';
  isEmbeddedPreview?: boolean;
  refreshTrigger?: number;
  shopifyInspectorActive?: boolean;
  selectedSectionId?: string;
  onSelectSection?: (sectionId: EditableWebsiteSectionId) => void;
  onMoveSection?: (sectionId: EditableWebsiteSectionId, direction: 'up' | 'down') => void;
  onToggleSectionVisibility?: (sectionId: EditableWebsiteSectionId) => void;
  isMarketingShareMode?: boolean;
  onChangeMarketingTheme?: (themeId: RoyalThemeId) => void;
  onUpdateSettings?: (patch: Partial<TenantSettings>) => void;
  onUpdateSalonName?: (name: string) => void;
}

const SafeSalonImage: React.FC<{
  src?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}> = ({ src, fallbackSrc, alt, className }) => {
  const effectivePrimary = src && src.trim().length > 0 ? src : fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string>(effectivePrimary);

  useEffect(() => {
    setImgSrc(src && src.trim().length > 0 ? src : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      className={className}
    />
  );
};

/**
 * Shopify Online Store 2.0-style Interactive Section Frame.
 * Highlights any website section on hover/selection and lets the salon owner
 * click directly on the live website preview to edit, reorder, or hide that section.
 */
const ShopifySectionFrame: React.FC<{
  sectionId: EditableWebsiteSectionId;
  label: string;
  hindiLabel: string;
  active: boolean;
  isSelected: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canHide?: boolean;
  onSelect?: (id: EditableWebsiteSectionId) => void;
  onMove?: (id: EditableWebsiteSectionId, dir: 'up' | 'down') => void;
  onToggleHide?: (id: EditableWebsiteSectionId) => void;
  children: React.ReactNode;
}> = ({
  sectionId,
  label,
  hindiLabel,
  active,
  isSelected,
  canMoveUp,
  canMoveDown,
  canHide,
  onSelect,
  onMove,
  onToggleHide,
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect(sectionId);
        }
      }}
      className={`relative transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-600 ring-inset z-20'
          : hovered
          ? 'ring-2 ring-blue-500/75 ring-inset z-20'
          : ''
      }`}
    >
      {(isSelected || hovered) && (
        <div
          className={`absolute top-2.5 left-3 right-3 z-40 flex items-center justify-between gap-2 pointer-events-none`}
        >
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-lg flex items-center gap-1.5 transition-all ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-950/90 text-blue-300 border border-blue-500/40'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>
              {isSelected ? `Editing: ${label} (${hindiLabel})` : `${label} · Click to Edit`}
            </span>
          </div>

          {/* Quick Floating Section Actions (Move Up / Move Down / Hide) */}
          {(onMove || onToggleHide) && (
            <div
              className="pointer-events-auto flex items-center gap-1 bg-neutral-950/95 text-white px-2 py-1 rounded-md shadow-lg border border-white/15"
              onClick={(e) => e.stopPropagation()}
            >
              {onMove && (canMoveUp || canMoveDown) && (
                <>
                  <button
                    type="button"
                    disabled={!canMoveUp}
                    onClick={() => onMove(sectionId, 'up')}
                    className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveDown}
                    onClick={() => onMove(sectionId, 'down')}
                    className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </>
              )}
              {onToggleHide && canHide && (
                <button
                  type="button"
                  onClick={() => onToggleHide(sectionId)}
                  className="p-1 hover:bg-rose-600/40 text-rose-300 rounded flex items-center gap-1 text-[10px] font-semibold px-1.5"
                  title="Hide Section"
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Hide</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export const PublicSalonSite: React.FC<PublicSalonSiteProps> = ({
  slug,
  onOpenOwnerLogin,
  overrideThemeId,
  overrideSettings,
  overrideSalonName,
  overrideServices,
  overrideGallery,
  isEmbeddedPreview = false,
  refreshTrigger = 0,
  shopifyInspectorActive = false,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onToggleSectionVisibility,
  isMarketingShareMode = false,
  onChangeMarketingTheme,
  onUpdateSettings,
  onUpdateSalonName,
}) => {
  const [data, setData] = useState<{
    tenant: Tenant;
    services: Service[];
    gallery: GalleryItem[];
    reviews: Review[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<{ status: number; message: string } | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeImageModal, setActiveImageModal] = useState<GalleryItem | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('11:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [inlineEditModal, setInlineEditModal] = useState<{
    type: 'photo' | 'text' | 'button';
    title: string;
    settingKey: keyof TenantSettings;
    currentValue: string;
    isTextarea?: boolean;
    serviceId?: string;
  } | null>(null);

  const isPureThemePreview = Boolean(isMarketingShareMode || overrideThemeId || isEmbeddedPreview);

  useEffect(() => {
    loadSalonData();
  }, [slug, refreshTrigger, overrideThemeId, isMarketingShareMode]);

  useEffect(() => {
    const servicesList = overrideServices || data?.services || FALLBACK_PREVIEW_SERVICES;
    const uniqueCats = Array.from(new Set(servicesList.map((s) => s.category)));
    const showAllTab = overrideSettings?.showAllCategoryTab !== false && data?.tenant?.settings?.showAllCategoryTab !== false;
    if (!showAllTab && selectedCategory === 'All' && uniqueCats.length > 0) {
      setSelectedCategory(uniqueCats[0]);
    }
  }, [overrideSettings?.showAllCategoryTab, data?.tenant?.settings?.showAllCategoryTab, selectedCategory, overrideServices, data?.services]);

  const buildFallbackThemeData = (themeIdToUse: RoyalThemeId) => {
    const tDef = ROYAL_THEMES[themeIdToUse] || ROYAL_THEMES['royal-gold'];
    return {
      tenant: {
        id: 'preview_tenant',
        slug: slug || 'salon',
        name: overrideSalonName || `${tDef.name} Bridal & Beauty Studio`,
        owner_id: 'owner_preview',
        status: 'active' as const,
        plan_id: 'pro',
        subscription_status: 'active' as const,
        subscription_starts_at: new Date().toISOString(),
        subscription_expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          themeId: themeIdToUse,
          tagline: tDef.defaultCopy.tagline,
          heroHeadline: tDef.defaultCopy.heroHeadline,
          heroSubheadline: tDef.defaultCopy.heroSubheadline,
          phone: '+91 98765 43210',
          email: 'bookings@yoursalon.com',
          address: 'Main Luxury High Street, Floor 1',
          city: 'Ahmedabad',
          primaryColor: tDef.palette.accentPrimary,
          currency: '₹',
          openingHours: [
            { day: 'Monday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
            { day: 'Tuesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
            { day: 'Wednesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
            { day: 'Thursday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
            { day: 'Friday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
            { day: 'Saturday', isOpen: true, openTime: '09:30', closeTime: '21:00' },
            { day: 'Sunday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
          ],
        },
      },
      services: FALLBACK_PREVIEW_SERVICES,
      gallery: FALLBACK_PREVIEW_GALLERY,
      reviews: FALLBACK_PREVIEW_REVIEWS,
    };
  };

  const loadSalonData = async () => {
    setLoading(true);
    setErrorStatus(null);
    setBookingSuccess(null);

    // If pure marketing theme share mode (?theme=...) without a specific business, load clean theme showcase data immediately
    if (isMarketingShareMode) {
      const targetTheme = resolveSafeThemeId(overrideThemeId, 'royal-gold');
      const fallback = buildFallbackThemeData(targetTheme);
      setData(fallback);
      setSelectedService(fallback.services[0]);
      setLoading(false);
      return;
    }

    try {
      const res = await saasApi.getPublicTenant(slug);
      setData({
        tenant: res.tenant,
        services: res.services && res.services.length > 0 ? res.services : FALLBACK_PREVIEW_SERVICES,
        gallery: res.gallery && res.gallery.length > 0 ? res.gallery : FALLBACK_PREVIEW_GALLERY,
        reviews: res.reviews && res.reviews.length > 0 ? res.reviews : FALLBACK_PREVIEW_REVIEWS,
      });
      if (res.services && res.services.length > 0) {
        setSelectedService(res.services[0]);
      } else {
        setSelectedService(FALLBACK_PREVIEW_SERVICES[0]);
      }
    } catch (err: any) {
      // Never fail to load a theme if we are previewing a theme in Theme Store, Editor, or Marketing Link
      if (isPureThemePreview) {
        const targetTheme = resolveSafeThemeId(overrideThemeId, 'royal-gold');
        const fallback = buildFallbackThemeData(targetTheme);
        setData(fallback);
        setSelectedService(fallback.services[0]);
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        setErrorStatus({ status: 404, message: `Salon website '${slug}' not found.` });
      } else if (err.message.includes('suspended')) {
        setErrorStatus({
          status: 403,
          message: 'This salon website is currently paused by administration.',
        });
      } else {
        setErrorStatus({ status: 500, message: err.message || 'Failed to load salon website' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (service?: Service) => {
    if (service) {
      setSelectedService(service);
    }
    if (!bookingDate) {
      const tomorrow = new Date(Date.now() + 86400000);
      setBookingDate(tomorrow.toISOString().split('T')[0]);
    }
    setBookingError(null);
    setIsBookingOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      setBookingError('Please select a service.');
      return;
    }
    if (!bookingDate) {
      setBookingError('Please select an appointment date.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setBookingError('Customer name and contact telephone are required.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const res = await saasApi.bookAppointment(slug, {
        service_id: selectedService.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        appointment_date: bookingDate,
        appointment_time: bookingTime,
        customer_notes: customerNotes,
      });

      setBookingSuccess(res.booking);
      setCustomerNotes('');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit appointment request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-neutral-50 text-neutral-600">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-800 mb-4" />
        <h3 className="text-base font-medium text-neutral-900">Loading Luxury Salon Experience...</h3>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6 bg-neutral-100">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-neutral-200 text-center">
          {errorStatus.status === 404 ? (
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}
          <h2 className="text-xl font-serif font-bold text-neutral-900 mb-2">
            {errorStatus.status === 404 ? 'Salon Website Not Found' : 'Salon Website Notice'}
          </h2>
          <p className="text-sm text-neutral-600 mb-6">{errorStatus.message}</p>
          <button
            onClick={loadSalonData}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tenant } = data;
  const services = overrideServices || data.services;
  const gallery = overrideGallery || data.gallery;
  const reviews = data.reviews;

  // Resolve active theme: overrideThemeId > overrideSettings.themeId > tenant.settings.themeId > 'royal-gold'
  const activeThemeId: RoyalThemeId = resolveSafeThemeId(
    overrideThemeId || overrideSettings?.themeId || tenant.settings?.themeId,
    'royal-gold'
  );
  const baseTheme: RoyalThemeTokens = ROYAL_THEMES[activeThemeId];

  const baseSettings = tenant.settings || ({} as TenantSettings);
  // True when previewing a different theme via Theme Store or Marketing Share Link without custom editor overrides
  const isExternalThemePreview = Boolean(
    isMarketingShareMode || (overrideThemeId && !overrideSettings && overrideThemeId !== baseSettings.themeId)
  );

  const settings: TenantSettings = {
    ...baseSettings,
    ...(overrideSettings || {}),
    ...(isExternalThemePreview
      ? {
          themeId: activeThemeId,
          tagline: baseTheme.defaultCopy.tagline,
          heroHeadline: baseTheme.defaultCopy.heroHeadline,
          heroSubheadline: baseTheme.defaultCopy.heroSubheadline,
          servicesKicker: baseTheme.defaultCopy.servicesKicker,
          servicesHeading: baseTheme.defaultCopy.servicesHeading,
          aboutTitle: baseTheme.defaultCopy.aboutTitle,
          aboutDescription: baseTheme.defaultCopy.aboutDescription,
          layoutVariant: baseTheme.layoutVariant,
          serviceCardStyle: baseTheme.typography.serviceCardStyle,
          heroImageUrl: '',
          customColors: {},
          currency: '₹',
        }
      : {}),
    customColors: isExternalThemePreview
      ? {}
      : {
          ...(baseSettings.customColors || {}),
          ...(overrideSettings?.customColors || {}),
        },
  };

  // Never display another salon's name when in pure Marketing Share Mode
  const displayName =
    overrideSalonName ||
    (isMarketingShareMode ? `${baseTheme.name} Bridal & Beauty Studio` : tenant.name);

  const applyInlineSave = (newVal: string) => {
    if (!onUpdateSettings || !inlineEditModal) return;
    if (inlineEditModal.settingKey === 'servicePhotos' && inlineEditModal.serviceId) {
      const updatedMap = {
        ...(settings.servicePhotos || {}),
        [inlineEditModal.serviceId]: newVal,
      };
      onUpdateSettings({ servicePhotos: updatedMap });
    } else {
      onUpdateSettings({ [inlineEditModal.settingKey]: newVal });
    }
    setInlineEditModal(null);
  };

  // Merge custom colors on top of the selected Royal Theme palette
  const palette = {
    ...baseTheme.palette,
    ...(settings.customColors?.canvasBg ? { canvasBg: settings.customColors.canvasBg } : {}),
    ...(settings.customColors?.surfaceBg ? { surfaceBg: settings.customColors.surfaceBg } : {}),
    ...(settings.customColors?.heroBg ? { heroBg: settings.customColors.heroBg } : {}),
    ...(settings.customColors?.heroText ? { heroText: settings.customColors.heroText } : {}),
    ...(settings.customColors?.textPrimary ? { textPrimary: settings.customColors.textPrimary } : {}),
    ...(settings.customColors?.accentPrimary ? { accentPrimary: settings.customColors.accentPrimary } : {}),
    ...(settings.customColors?.accentSecondary
      ? { accentSecondary: settings.customColors.accentSecondary, borderAccent: settings.customColors.accentSecondary }
      : {}),
    ...(settings.customColors?.buttonBg ? { buttonBg: settings.customColors.buttonBg } : {}),
    ...(settings.customColors?.buttonText ? { buttonText: settings.customColors.buttonText } : {}),
    ...(settings.customColors?.footerBg ? { footerBg: settings.customColors.footerBg } : {}),
  };

  // Resolve typography & layout overrides
  const headingFont =
    (isExternalThemePreview ? undefined : settings.headingFont) || baseTheme.typography.headingFont;
  const bodyFont = settings.bodyFont || "'Plus Jakarta Sans', system-ui, sans-serif";
  const layoutVariant =
    (isExternalThemePreview ? undefined : settings.layoutVariant) || baseTheme.layoutVariant;
  const serviceCardStyle =
    (isExternalThemePreview ? undefined : settings.serviceCardStyle) || baseTheme.typography.serviceCardStyle;
  const isRoseLuxe = activeThemeId === 'rose-luxe' || layoutVariant === 'rose-luxe-pink';

  const letterSpacingClass =
    settings.letterSpacingStyle === 'editorial'
      ? 'tracking-wider'
      : settings.letterSpacingStyle === 'wide'
      ? 'tracking-wide'
      : 'tracking-tight';

  // Section visibility flags
  const showNoticeBanner = settings.showNoticeBanner !== false && Boolean(settings.noticeBanner);
  const showStatsStrip = settings.showStatsStrip !== false;
  const showWhyChooseUs =
    settings.showWhyChooseUs !== undefined ? settings.showWhyChooseUs : true;
  const showAboutSection = settings.showAboutSection !== false;
  const showGallerySection = settings.showGallerySection !== false && gallery && gallery.length > 0;
  const showReviewsSection = settings.showReviewsSection !== false && reviews && reviews.length > 0;
  const showHoursSection = settings.showHoursSection !== false;

  // Categories for interactive filter
  const uniqueCategories = Array.from(new Set(services.map((s) => s.category)));
  const showAllTab = settings.showAllCategoryTab !== false;
  const categories = showAllTab ? ['All', ...uniqueCategories] : uniqueCategories;

  const filteredServices =
    selectedCategory === 'All' && showAllTab
      ? services
      : selectedCategory === 'All' && !showAllTab && uniqueCategories.length > 0
      ? services.filter((s) => s.category === uniqueCategories[0])
      : services.filter((s) => s.category === selectedCategory);

  // Today's opening hours
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()];
  const todayHours = settings.openingHours?.find((h: any) => h.day === todayName);

  // Hero Image source: if custom photo was uploaded, use it; otherwise use the active theme's watermark-free hero artwork
  const heroPhotoSrc = !isDefaultOrPresetHeroImage(settings.heroImageUrl)
    ? settings.heroImageUrl!
    : getThemeHeroBackdropUri(activeThemeId);

  const aboutPhotoSrc =
    settings.aboutImageUrl && !settings.aboutImageUrl.includes('images.unsplash.com')
      ? settings.aboutImageUrl
      : INDIAN_SALON_PHOTO_LIBRARY[7].imageUrl;

  // Helper to resolve a rich visual image for each service card & collage tile
  const getServiceImageSrc = (service: Service, index: number): string => {
    if (settings.servicePhotos?.[service.id]) {
      return settings.servicePhotos[service.id];
    }
    const matchingGallery = gallery.find(
      (g) =>
        g.category.toLowerCase().includes(service.category.toLowerCase()) ||
        service.category.toLowerCase().includes(g.category.toLowerCase())
    );
    if (matchingGallery?.image_url && !matchingGallery.image_url.includes('images.unsplash.com')) {
      return matchingGallery.image_url;
    }
    const preset = INDIAN_SALON_PHOTO_LIBRARY[index % INDIAN_SALON_PHOTO_LIBRARY.length];
    return preset ? preset.imageUrl : getGalleryArtworkDataUri(service.name, service.category, baseTheme);
  };

  // 4 photos for the About 2x2 Collage Grid
  const aboutCollagePhotos = [
    aboutPhotoSrc,
    gallery[0]?.image_url && !gallery[0].image_url.includes('images.unsplash.com')
      ? gallery[0].image_url
      : INDIAN_SALON_PHOTO_LIBRARY[2].imageUrl,
    gallery[1]?.image_url && !gallery[1].image_url.includes('images.unsplash.com')
      ? gallery[1].image_url
      : INDIAN_SALON_PHOTO_LIBRARY[4].imageUrl,
    gallery[2]?.image_url && !gallery[2].image_url.includes('images.unsplash.com')
      ? gallery[2].image_url
      : INDIAN_SALON_PHOTO_LIBRARY[3].imageUrl,
  ];

  // Resolve Shopify-style dynamic section order
  const effectiveSectionOrder: EditableWebsiteSectionId[] = (() => {
    if (Array.isArray(settings.sectionOrder) && settings.sectionOrder.length > 0) {
      const valid = settings.sectionOrder.filter((s): s is EditableWebsiteSectionId =>
        DEFAULT_SECTION_ORDER.includes(s as EditableWebsiteSectionId)
      );
      const missing = DEFAULT_SECTION_ORDER.filter((s) => !valid.includes(s));
      return [...valid, ...missing];
    }
    return DEFAULT_SECTION_ORDER;
  })();

  const availableSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:30',
    '13:30',
    '14:00',
    '15:00',
    '15:30',
    '16:30',
    '17:00',
    '18:00',
  ];

  const defaultWhyChooseCards = [
    {
      title: 'Premium Quality',
      desc: 'Only the finest international & organic products for exceptional results',
    },
    {
      title: '100% Hygienic & Safe',
      desc: 'Sterilized tools, disposable kits, and certified skin-safe products',
    },
    {
      title: 'On-Time Appointments',
      desc: 'We respect your time with punctual, zero-wait appointments',
    },
    {
      title: 'Expert Bridal Stylists',
      desc: 'Trained makeup & hair specialists dedicated to your satisfaction',
    },
  ];

  const whyChooseCards =
    settings.whyChooseUsCards && settings.whyChooseUsCards.length === 4
      ? settings.whyChooseUsCards
      : defaultWhyChooseCards;

  // Modular Renderers for Reorderable Template Sections
  const renderServicesSection = (secIndex: number) => (
    <ShopifySectionFrame
      key="services"
      sectionId="services"
      label="Services & Pricing"
      hindiLabel="सर्विसेज और प्राइस"
      active={shopifyInspectorActive}
      isSelected={selectedSectionId === 'services'}
      canMoveUp={secIndex > 0}
      canMoveDown={secIndex < effectiveSectionOrder.length - 1}
      canHide={false}
      onSelect={onSelectSection}
      onMove={onMoveSection}
    >
      <section id="services" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isRoseLuxe || serviceCardStyle === 'photo-card' ? (
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: palette.buttonBg }}
            >
              ✦ {settings.servicesKicker || baseTheme.defaultCopy.servicesKicker} ✦
            </div>
            <h2
              className={`text-3xl sm:text-4xl font-bold ${letterSpacingClass}`}
              style={{ color: palette.textPrimary, fontFamily: headingFont }}
            >
              {settings.servicesHeading || baseTheme.defaultCopy.servicesHeading}
            </h2>
            <p className="text-xs sm:text-sm mt-2" style={{ color: palette.textSecondary }}>
              {settings.servicesSubheading ||
                'Luxury treatments tailored for you, delivered by skilled professionals'}
            </p>

            {/* Centered Category Filter Buttons */}
            <div
              className="mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full border bg-white shadow-sm"
              style={{ borderColor: palette.borderSubtle }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: isSelected ? palette.buttonBg : 'transparent',
                      color: isSelected ? palette.buttonText : palette.textSecondary,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: palette.accentSecondary }}>
                {settings.servicesKicker || baseTheme.defaultCopy.servicesKicker}
              </div>
              <h2
                className={`text-2xl sm:text-4xl font-bold ${letterSpacingClass}`}
                style={{ color: palette.textPrimary, fontFamily: headingFont }}
              >
                {settings.servicesHeading || baseTheme.defaultCopy.servicesHeading}
              </h2>
            </div>

            {/* Interactive Category Segmented Filter Controls */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg border overflow-x-auto"
              style={{
                backgroundColor: palette.surfaceBg,
                borderColor: palette.borderSubtle,
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: isSelected ? palette.buttonBg : 'transparent',
                      color: isSelected ? palette.buttonText : palette.textSecondary,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Services Cards / Rows */}
        {isRoseLuxe || serviceCardStyle === 'photo-card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredServices.map((service, idx) => {
              const serviceImg = getServiceImageSrc(service, idx);
              return (
                <div
                  key={service.id}
                  className="rounded-2xl overflow-hidden bg-white border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-[0_10px_30px_rgba(225,29,116,0.07)]"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div
                      onClick={() => {
                        if (shopifyInspectorActive) {
                          setInlineEditModal({
                            type: 'photo',
                            title: `Change Photo for "${service.name}"`,
                            settingKey: 'servicePhotos',
                            currentValue: serviceImg,
                            serviceId: service.id,
                          });
                        }
                      }}
                      className={`aspect-[16/10] overflow-hidden relative bg-pink-50 ${
                        shopifyInspectorActive ? 'cursor-pointer ring-2 ring-blue-500/50 hover:ring-blue-600' : ''
                      }`}
                    >
                      <SafeSalonImage
                        src={serviceImg}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      {shopifyInspectorActive && (
                        <div className="absolute inset-0 bg-neutral-950/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5 p-2 text-center shadow-md">
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span>Click to Change Service Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 pb-3">
                      <div className="text-[11px] font-medium mb-1" style={{ color: palette.textMuted }}>
                        {service.category} · {service.duration_minutes} mins
                      </div>
                      <h3
                        className="text-lg font-bold"
                        style={{ color: palette.textPrimary, fontFamily: headingFont }}
                      >
                        {service.name}
                      </h3>
                      <p
                        className="text-xs mt-1.5 leading-relaxed line-clamp-2"
                        style={{ color: palette.textSecondary }}
                      >
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 flex items-center justify-between">
                    <div className="tabular-nums">
                      <span
                        className="text-sm font-bold"
                        style={{ color: palette.buttonBg }}
                      >
                        From {settings.currency || '₹'}
                        {service.price}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(service)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 shadow-sm"
                      style={{
                        backgroundColor: palette.buttonBg,
                        color: palette.buttonText,
                      }}
                    >
                      {settings.serviceBookBtnText || 'Book Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : serviceCardStyle === 'editorial-row' ? (
          <div
            className="divide-y border-t border-b"
            style={{ borderColor: palette.borderSubtle }}
          >
            {filteredServices.map((service, idx) => (
              <div
                key={service.id}
                className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors"
              >
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-xs mb-1" style={{ color: palette.textMuted }}>
                    <span className="font-mono tabular-nums">0{idx + 1}.</span>
                    <span>{service.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{service.duration_minutes} mins</span>
                    {service.is_popular ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span style={{ color: palette.accentSecondary }}>Signature Treatment</span>
                      </>
                    ) : null}
                  </div>

                  <h3
                    className="text-lg font-bold"
                    style={{ color: palette.textPrimary, fontFamily: headingFont }}
                  >
                    {service.name}
                  </h3>

                  <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: palette.textSecondary }}>
                    {service.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div
                    className="text-xl font-bold tabular-nums"
                    style={{ color: palette.textPrimary, fontFamily: headingFont }}
                  >
                    {settings.currency || '₹'}
                    {service.price}
                  </div>

                  <button
                    onClick={() => handleOpenBooking(service)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: palette.buttonBg,
                      color: palette.buttonText,
                    }}
                  >
                    <span>{settings.serviceBookBtnText || 'Book Service'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => (
              <div
                key={service.id}
                className="rounded-xl p-6 border flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                style={{
                  backgroundColor: palette.surfaceBg,
                  borderColor:
                    serviceCardStyle === 'framed'
                      ? palette.borderAccent
                      : palette.borderSubtle,
                }}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: palette.textMuted }}>
                    <span className="font-mono tabular-nums">0{idx + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span>{service.category}</span>
                    {service.is_popular ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span style={{ color: palette.accentSecondary }}>Signature</span>
                      </>
                    ) : null}
                  </div>

                  <h3
                    className="text-lg font-bold"
                    style={{ color: palette.textPrimary, fontFamily: headingFont }}
                  >
                    {service.name}
                  </h3>

                  <p
                    className="text-xs mt-2 mb-6 leading-relaxed line-clamp-3"
                    style={{ color: palette.textSecondary }}
                  >
                    {service.description}
                  </p>
                </div>

                <div
                  className="pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div className="tabular-nums">
                    <div className="text-xs" style={{ color: palette.textMuted }}>
                      {service.duration_minutes} mins
                    </div>
                    <div
                      className="text-xl font-bold mt-0.5"
                      style={{ color: palette.textPrimary, fontFamily: headingFont }}
                    >
                      {settings.currency || '₹'}
                      {service.price}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(service)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1 whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: palette.buttonBg,
                      color: palette.buttonText,
                    }}
                  >
                    <span>{settings.serviceBookBtnText || 'Book Service'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ShopifySectionFrame>
  );

  const renderWhyChooseUsSection = (secIndex: number) => {
    if (!showWhyChooseUs) return null;
    const icons = [Crown, Sparkles, Clock, Heart];
    return (
      <ShopifySectionFrame
        key="why-choose-us"
        sectionId="why-choose-us"
        label="Why Choose Us (4 Pillars)"
        hindiLabel="क्यों चुनें हमें"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'why-choose-us'}
        canMoveUp={secIndex > 0}
        canMoveDown={secIndex < effectiveSectionOrder.length - 1}
        canHide={true}
        onSelect={onSelectSection}
        onMove={onMoveSection}
        onToggleHide={onToggleSectionVisibility}
      >
        <section
          className="py-16 sm:py-20 border-t border-b"
          style={{
            background: isRoseLuxe
              ? `linear-gradient(135deg, ${palette.surfaceBg} 0%, ${palette.canvasBg} 50%, #fce7f3 100%)`
              : palette.surfaceBg,
            borderColor: palette.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: isRoseLuxe ? palette.buttonBg : palette.accentSecondary }}
              >
                ✦ {settings.whyChooseUsKicker || 'WHY CHOOSE US'} ✦
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-bold ${letterSpacingClass}`}
                style={{ color: palette.textPrimary, fontFamily: headingFont }}
              >
                {settings.whyChooseUsHeading || `Why Clients Trust ${displayName}`}
              </h2>
              <p className="text-xs sm:text-sm mt-2" style={{ color: palette.textSecondary }}>
                {settings.whyChooseUsSubheading ||
                  'Experience the luxury, hygiene, and artistry that set our salon apart'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyChooseCards.map((item, idx) => {
                const IconComp = icons[idx % icons.length];
                return (
                  <div
                    key={idx}
                    className="rounded-2xl p-6 text-center border shadow-[0_8px_28px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: isRoseLuxe ? 'rgba(255,255,255,0.95)' : palette.canvasBg,
                      borderColor: palette.borderSubtle,
                    }}
                  >
                    <div
                      className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: isRoseLuxe ? '#fdf2f8' : palette.surfaceBg,
                        color: isRoseLuxe ? palette.buttonBg : palette.accentSecondary,
                      }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3
                      className="text-base font-bold mb-2"
                      style={{ color: palette.textPrimary, fontFamily: headingFont }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </ShopifySectionFrame>
    );
  };

  const renderAboutSection = (secIndex: number) => {
    if (!showAboutSection) return null;
    return (
      <ShopifySectionFrame
        key="about"
        sectionId="about"
        label="About Salon & Story"
        hindiLabel="हमारे बारे में और फोटो"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'about'}
        canMoveUp={secIndex > 0}
        canMoveDown={secIndex < effectiveSectionOrder.length - 1}
        canHide={true}
        onSelect={onSelectSection}
        onMove={onMoveSection}
        onToggleHide={onToggleSectionVisibility}
      >
        <section
          id="about"
          className="py-16 sm:py-20 border-b"
          style={{
            backgroundColor: isRoseLuxe ? palette.canvasBg : palette.surfaceBg,
            borderColor: palette.borderSubtle,
          }}
        >
          {isRoseLuxe ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left: 2x2 Photo Collage Grid + Floating Experience Badge */}
              <div className="lg:col-span-6 relative">
                <div className="grid grid-cols-2 gap-3.5">
                  {aboutCollagePhotos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl overflow-hidden border shadow-md aspect-[4/3] ${
                        idx === 1 ? 'mt-4' : idx === 2 ? '-mt-4' : ''
                      }`}
                      style={{ borderColor: palette.borderSubtle }}
                    >
                      <SafeSalonImage
                        src={photoUrl}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={`${displayName} studio ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Floating Experience Card Badge */}
                <div
                  className="mt-4 sm:mt-0 sm:absolute sm:-bottom-5 sm:right-6 bg-white rounded-2xl px-4 py-3 shadow-xl border flex items-center gap-3"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#fdf2f8', color: palette.buttonBg }}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold leading-tight" style={{ color: palette.textPrimary }}>
                      {settings.aboutExpYears || '10+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textSecondary }}>
                      {settings.aboutExpLabel || 'Years Experience'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Salon Story + 3 Stat Counters + Button */}
              <div className="lg:col-span-6">
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
                  style={{ color: palette.buttonBg }}
                >
                  ✦ {settings.aboutKicker || 'ABOUT US'}
                </div>
                <h2
                  className={`text-3xl sm:text-4xl font-bold mb-4 ${letterSpacingClass}`}
                  style={{ color: palette.textPrimary, fontFamily: headingFont }}
                >
                  {settings.aboutTitle || baseTheme.defaultCopy.aboutTitle}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed mb-4" style={{ color: palette.textSecondary }}>
                  {settings.aboutDescription ||
                    `At ${displayName}, we believe every woman deserves to feel beautiful and confident. Our journey began with a simple vision — to create a sanctuary where luxury meets comfort, and beauty is celebrated in all its forms.`}
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: palette.textSecondary }}>
                  {settings.aboutDescription2 ||
                    `With a team of trained stylists and beauty experts, we bring world-class bridal, hair, and skin techniques to ${
                      settings.city || 'your city'
                    }. Every treatment is personalized, every product is genuine, and every visit is an experience you will cherish.`}
                </p>

                {/* 3 Icon Stat Counters */}
                <div
                  className="grid grid-cols-3 gap-4 py-4 mb-6 border-t border-b tabular-nums"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.buttonBg, fontFamily: headingFont }}
                    >
                      {settings.aboutStat1Value || '15+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat1Label || 'Years Exp.'}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.buttonBg, fontFamily: headingFont }}
                    >
                      {settings.aboutStat2Value || '20+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat2Label || 'Expert Stylists'}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.buttonBg, fontFamily: headingFont }}
                    >
                      {settings.aboutStat3Value || '5K+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat3Label || 'Happy Clients'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking()}
                  className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-full transition-opacity hover:opacity-90 inline-flex items-center gap-2 shadow-md"
                  style={{
                    backgroundColor: palette.buttonBg,
                    color: palette.buttonText,
                  }}
                >
                  <span>{settings.aboutBtnText || 'Book Consultation'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <div
                  className="rounded-xl overflow-hidden border aspect-[4/3]"
                  style={{ borderColor: palette.borderAccent }}
                >
                  <SafeSalonImage
                    src={aboutPhotoSrc}
                    fallbackSrc={getGalleryArtworkDataUri(displayName, 'Salon Story', baseTheme)}
                    alt={settings.aboutTitle || displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: palette.accentSecondary }}>
                  {settings.aboutKicker || `ABOUT ${displayName.toUpperCase()}`}
                </div>
                <h2
                  className={`text-2xl sm:text-3xl font-bold mb-4 ${letterSpacingClass}`}
                  style={{ color: palette.textPrimary, fontFamily: headingFont }}
                >
                  {settings.aboutTitle || baseTheme.defaultCopy.aboutTitle}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: palette.textSecondary }}>
                  {settings.aboutDescription || baseTheme.defaultCopy.aboutDescription}
                </p>

                <div
                  className="grid grid-cols-3 gap-4 py-4 mb-6 border-t border-b tabular-nums"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.accentSecondary, fontFamily: headingFont }}
                    >
                      {settings.aboutStat1Value || '12+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat1Label || 'Years Excellence'}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.accentSecondary, fontFamily: headingFont }}
                    >
                      {settings.aboutStat2Value || '15+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat2Label || 'Master Artists'}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: palette.accentSecondary, fontFamily: headingFont }}
                    >
                      {settings.aboutStat3Value || '5,000+'}
                    </div>
                    <div className="text-[11px]" style={{ color: palette.textMuted }}>
                      {settings.aboutStat3Label || 'Happy Clients'}
                    </div>
                  </div>
                </div>

                {(settings.aboutHighlight1 || settings.aboutHighlight2) && (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                  >
                    {settings.aboutHighlight1 && (
                      <div className="font-medium" style={{ color: palette.textPrimary }}>
                        01 · {settings.aboutHighlight1}
                      </div>
                    )}
                    {settings.aboutHighlight2 && (
                      <div className="font-medium" style={{ color: palette.textPrimary }}>
                        02 · {settings.aboutHighlight2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </ShopifySectionFrame>
    );
  };

  const renderGallerySection = (secIndex: number) => {
    if (!showGallerySection) return null;
    return (
      <ShopifySectionFrame
        key="gallery"
        sectionId="gallery"
        label="Indian Look Photo Gallery"
        hindiLabel="फोटो गैलरी"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'gallery'}
        canMoveUp={secIndex > 0}
        canMoveDown={secIndex < effectiveSectionOrder.length - 1}
        canHide={true}
        onSelect={onSelectSection}
        onMove={onMoveSection}
        onToggleHide={onToggleSectionVisibility}
      >
        <section
          id="gallery"
          className="py-16 sm:py-20 border-b"
          style={{
            backgroundColor: palette.surfaceBg,
            borderColor: palette.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={isRoseLuxe ? 'text-center max-w-2xl mx-auto mb-12' : 'mb-10'}>
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: isRoseLuxe ? palette.buttonBg : palette.accentSecondary }}
              >
                ✦ {settings.galleryKicker || 'OUR PORTFOLIO'} ✦
              </div>
              <h2
                className={`text-2xl sm:text-4xl font-bold ${letterSpacingClass}`}
                style={{ color: palette.textPrimary, fontFamily: headingFont }}
              >
                {settings.galleryHeading || 'Bridal & Salon Lookbook'}
              </h2>
              <p className="text-xs sm:text-sm mt-2" style={{ color: palette.textSecondary }}>
                {settings.gallerySubheading || 'A glimpse into our signature bridal transformations, hair artistry, and skin rituals'}
              </p>
            </div>

            {isRoseLuxe ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                {gallery.map((item, idx) => {
                  const fallbackArt = getGalleryArtworkDataUri(item.title, item.category, baseTheme);
                  const customPhoto =
                    item.image_url && !item.image_url.includes('images.unsplash.com')
                      ? item.image_url
                      : fallbackArt;
                  const spanClass =
                    idx === 0
                      ? 'lg:col-span-5 lg:row-span-2 aspect-[4/4] sm:aspect-auto'
                      : idx === 1 || idx === 2
                      ? 'lg:col-span-3 aspect-[4/3]'
                      : 'lg:col-span-4 aspect-[4/3]';

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        if (!shopifyInspectorActive) {
                          setActiveImageModal(item);
                        } else if (onSelectSection) {
                          e.stopPropagation();
                          onSelectSection('gallery');
                        }
                      }}
                      className={`group relative rounded-2xl overflow-hidden border cursor-pointer shadow-sm ${spanClass}`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: palette.borderSubtle,
                      }}
                    >
                      <SafeSalonImage
                        src={customPhoto}
                        fallbackSrc={fallbackArt}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                        <div className="text-[11px] text-pink-300 font-medium">{item.category}</div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: headingFont }}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item) => {
                  const fallbackArt = getGalleryArtworkDataUri(item.title, item.category, baseTheme);
                  const customPhoto =
                    item.image_url && !item.image_url.includes('images.unsplash.com')
                      ? item.image_url
                      : fallbackArt;
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        if (!shopifyInspectorActive) {
                          setActiveImageModal(item);
                        } else if (onSelectSection) {
                          e.stopPropagation();
                          onSelectSection('gallery');
                        }
                      }}
                      className="group rounded-xl overflow-hidden border cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: palette.canvasBg,
                        borderColor: palette.borderSubtle,
                      }}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <SafeSalonImage
                          src={customPhoto}
                          fallbackSrc={fallbackArt}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: palette.textMuted }}>
                            {item.category}
                          </div>
                          <h3
                            className="text-sm font-bold mt-0.5"
                            style={{ color: palette.textPrimary, fontFamily: headingFont }}
                          >
                            {item.title}
                          </h3>
                        </div>
                        <span className="text-xs font-medium underline" style={{ color: palette.accentSecondary }}>
                          View
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </ShopifySectionFrame>
    );
  };

  const renderReviewsSection = (secIndex: number) => {
    if (!showReviewsSection) return null;
    return (
      <ShopifySectionFrame
        key="reviews"
        sectionId="reviews"
        label="Client Reviews & Testimonials"
        hindiLabel="ग्राहक रिव्यु"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'reviews'}
        canMoveUp={secIndex > 0}
        canMoveDown={secIndex < effectiveSectionOrder.length - 1}
        canHide={true}
        onSelect={onSelectSection}
        onMove={onMoveSection}
        onToggleHide={onToggleSectionVisibility}
      >
        <section id="reviews" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={isRoseLuxe ? 'text-center max-w-2xl mx-auto mb-10' : 'mb-10'}>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: isRoseLuxe ? palette.buttonBg : palette.accentSecondary }}
            >
              ✦ {settings.reviewsKicker || 'CLIENT LOVE & TESTIMONIALS'} ✦
            </div>
            <h2
              className={`text-2xl sm:text-3xl font-bold ${letterSpacingClass}`}
              style={{ color: palette.textPrimary, fontFamily: headingFont }}
            >
              {settings.reviewsHeading || 'What Our Clients Say'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl p-6 border flex flex-col justify-between"
                style={{
                  backgroundColor: isRoseLuxe ? '#ffffff' : palette.surfaceBg,
                  borderColor: palette.borderSubtle,
                }}
              >
                <div>
                  <div className="flex items-center gap-1 mb-3 tabular-nums">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5"
                        style={{
                          fill: i < rev.rating ? palette.accentSecondary : 'transparent',
                          color: i < rev.rating ? palette.accentSecondary : palette.textMuted,
                        }}
                      />
                    ))}
                    <span className="ml-2 text-xs font-bold" style={{ color: palette.textPrimary }}>
                      {rev.rating}.0
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm italic leading-relaxed mb-6" style={{ color: palette.textSecondary }}>
                    "{rev.comment}"
                  </p>
                </div>

                <div
                  className="pt-4 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div className="font-bold" style={{ color: palette.textPrimary }}>
                      {rev.author_name}
                    </div>
                    <div style={{ color: palette.textMuted }}>
                      {rev.service_tag} · Verified Client
                    </div>
                  </div>
                  <div className="font-mono tabular-nums" style={{ color: palette.textMuted }}>
                    {rev.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ShopifySectionFrame>
    );
  };

  const renderHoursSection = (secIndex: number) => {
    if (!showHoursSection) return null;
    return (
      <ShopifySectionFrame
        key="hours"
        sectionId="hours"
        label="Opening Hours & Location"
        hindiLabel="समय और पता"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'hours'}
        canMoveUp={secIndex > 0}
        canMoveDown={secIndex < effectiveSectionOrder.length - 1}
        canHide={true}
        onSelect={onSelectSection}
        onMove={onMoveSection}
        onToggleHide={onToggleSectionVisibility}
      >
        <section
          id="hours"
          className="py-16 border-t"
          style={{
            backgroundColor: palette.surfaceBg,
            borderColor: palette.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Opening Hours Table */}
              <div
                className="rounded-2xl p-8 border"
                style={{
                  backgroundColor: isRoseLuxe ? '#ffffff' : palette.canvasBg,
                  borderColor: palette.borderSubtle,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3
                      className="text-xl font-bold"
                      style={{ color: palette.textPrimary, fontFamily: headingFont }}
                    >
                      {settings.hoursHeading || 'Salon Opening Hours'}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: palette.textMuted }}>
                      {settings.hoursSubheading || 'Prior appointment booking recommended'}
                    </p>
                  </div>

                  {todayHours && (
                    <span className="text-xs font-semibold tabular-nums" style={{ color: palette.accentSecondary }}>
                      {todayHours.isOpen
                        ? `Open Today · ${todayHours.openTime}–${todayHours.closeTime}`
                        : 'Closed Today'}
                    </span>
                  )}
                </div>

                <div className="divide-y text-xs tabular-nums" style={{ borderColor: palette.borderSubtle }}>
                  {(settings.openingHours || []).map((h: any) => {
                    const isToday = h.day === todayName;
                    return (
                      <div
                        key={h.day}
                        className="flex items-center justify-between py-2.5"
                        style={{
                          color: isToday ? palette.textPrimary : palette.textSecondary,
                          fontWeight: isToday ? 700 : 400,
                        }}
                      >
                        <span>
                          {h.day} {isToday ? '(Today)' : ''}
                        </span>
                        <span className="font-mono">
                          {h.isOpen ? `${h.openTime} – ${h.closeTime}` : 'Closed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Boutique Location & Concierge */}
              <div
                className="rounded-2xl p-8 border flex flex-col justify-between"
                style={{
                  backgroundColor: isRoseLuxe ? '#ffffff' : palette.canvasBg,
                  borderColor: palette.borderSubtle,
                }}
              >
                <div>
                  <h3
                    className="text-xl font-bold mb-6"
                    style={{ color: palette.textPrimary, fontFamily: headingFont }}
                  >
                    {settings.contactHeading || 'Salon Address & Direct Contact'}
                  </h3>

                  <div className="space-y-5 text-xs">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.accentSecondary }} />
                      <div>
                        <div className="font-semibold" style={{ color: palette.textPrimary }}>
                          Salon Address
                        </div>
                        <div className="mt-0.5" style={{ color: palette.textSecondary }}>
                          {settings.address || 'Main Luxury Avenue'}, {settings.city || 'India'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.accentSecondary }} />
                      <div>
                        <div className="font-semibold" style={{ color: palette.textPrimary }}>
                          Phone & WhatsApp Booking
                        </div>
                        <a
                          href={`tel:${settings.phone}`}
                          className="hover:underline tabular-nums mt-0.5 block"
                          style={{ color: palette.textSecondary }}
                        >
                          {settings.phone || '+91 98765 43210'}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.accentSecondary }} />
                      <div>
                        <div className="font-semibold" style={{ color: palette.textPrimary }}>
                          Email Address
                        </div>
                        <a
                          href={`mailto:${settings.email}`}
                          className="hover:underline mt-0.5 block"
                          style={{ color: palette.textSecondary }}
                        >
                          {settings.email || 'bookings@yoursalon.com'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-8 pt-6 border-t flex items-center justify-between"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <button
                    onClick={() => handleOpenBooking()}
                    className={`px-5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 ${
                      isRoseLuxe ? 'rounded-full' : 'rounded-lg'
                    }`}
                    style={{
                      backgroundColor: palette.buttonBg,
                      color: palette.buttonText,
                    }}
                  >
                    {settings.headerCtaText || 'Book Appointment Online'}
                  </button>

                  <div className="flex items-center gap-3" style={{ color: palette.textMuted }}>
                    {settings.socialLinks?.instagram && (
                      <a
                        href={settings.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="hover:opacity-80"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {settings.socialLinks?.facebook && (
                      <a
                        href={settings.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Facebook"
                        className="hover:opacity-80"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ShopifySectionFrame>
    );
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: palette.canvasBg,
        color: palette.textPrimary,
        fontFamily: bodyFont,
      }}
      data-theme-id={baseTheme.id}
    >
      {/* Slim Promotional Banner */}
      {showNoticeBanner && (
        <ShopifySectionFrame
          sectionId="announcement"
          label="Announcement Bar"
          hindiLabel="टॉप ऑफर बैनर"
          active={shopifyInspectorActive}
          isSelected={selectedSectionId === 'announcement'}
          canHide={true}
          onSelect={onSelectSection}
          onToggleHide={onToggleSectionVisibility}
        >
          <div
            className="text-xs font-medium py-2 px-4 text-center border-b truncate"
            style={{
              backgroundColor: palette.surfaceBg,
              color: palette.textPrimary,
              borderColor: palette.borderSubtle,
            }}
          >
            <span>{settings.noticeBanner}</span>
          </div>
        </ShopifySectionFrame>
      )}

      {/* Top Navigation Bar */}
      <ShopifySectionFrame
        sectionId="header"
        label="Header, Logo & Navigation"
        hindiLabel="हेडर और लोगो"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'header'}
        onSelect={onSelectSection}
      >
        <header
          className={`${isEmbeddedPreview ? 'relative' : 'sticky top-0'} z-30 border-b backdrop-blur-md transition-colors`}
          style={{
            backgroundColor: isRoseLuxe ? '#ffffff' : palette.canvasBg,
            borderColor: palette.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
            {/* Zone 1: Brand Wordmark + Custom Logo */}
            <a
              href="#top"
              onClick={(e) => {
                if (shopifyInspectorActive) e.preventDefault();
              }}
              className={`text-lg sm:text-xl font-bold whitespace-nowrap shrink-0 flex items-center gap-2.5 ${letterSpacingClass}`}
              style={{ color: palette.textPrimary, fontFamily: headingFont }}
            >
              {settings.showLogo !== false && settings.logoUrl && !settings.logoUrl.includes('images.unsplash.com') ? (
                <img
                  src={settings.logoUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border"
                  style={{ borderColor: palette.borderAccent }}
                />
              ) : (
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{
                    background: isRoseLuxe
                      ? `linear-gradient(135deg, ${palette.buttonBg}, #f472b6)`
                      : palette.buttonBg,
                    color: palette.buttonText,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </span>
              )}
              <span>{displayName}</span>
            </a>

            {/* Zone 2: Navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
              <a
                href="#top"
                onClick={(e) => {
                  if (shopifyInspectorActive) e.preventDefault();
                }}
                className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                style={{ color: isRoseLuxe ? palette.buttonBg : palette.textSecondary }}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  if (shopifyInspectorActive) e.preventDefault();
                }}
                className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                style={{ color: palette.textSecondary }}
              >
                {settings.navServicesLabel || 'Services'}
              </a>
              {showAboutSection && (
                <a
                  href="#about"
                  onClick={(e) => {
                    if (shopifyInspectorActive) e.preventDefault();
                  }}
                  className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                  style={{ color: palette.textSecondary }}
                >
                  About
                </a>
              )}
              {showGallerySection && (
                <a
                  href="#gallery"
                  onClick={(e) => {
                    if (shopifyInspectorActive) e.preventDefault();
                  }}
                  className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                  style={{ color: palette.textSecondary }}
                >
                  {settings.navGalleryLabel || 'Gallery'}
                </a>
              )}
              {showHoursSection && (
                <a
                  href="#hours"
                  onClick={(e) => {
                    if (shopifyInspectorActive) e.preventDefault();
                  }}
                  className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                  style={{ color: palette.textSecondary }}
                >
                  {settings.navHoursLabel || 'Contact'}
                </a>
              )}
            </nav>

            {/* Zone 3: Quick Call / WhatsApp + Primary Action Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {settings.phone && (
                <>
                  <a
                    href={`tel:${settings.phone}`}
                    title={`Call ${settings.phone}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: isRoseLuxe ? '#fff0f6' : palette.surfaceBg,
                      borderColor: palette.borderSubtle,
                      color: isRoseLuxe ? palette.buttonBg : palette.textPrimary,
                    }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp Salon"
                    className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </>
              )}

              <button
                onClick={(e) => {
                  if (shopifyInspectorActive && onSelectSection) {
                    e.stopPropagation();
                    onSelectSection('header');
                    return;
                  }
                  handleOpenBooking();
                }}
                className={`px-4 sm:px-5 py-2 text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 shadow-sm ${
                  isRoseLuxe ? 'rounded-full' : 'rounded-lg'
                }`}
                style={{
                  backgroundColor: palette.buttonBg,
                  color: palette.buttonText,
                }}
              >
                {settings.headerCtaText || (isRoseLuxe ? 'Book Now' : 'Book Appointment')}
              </button>
            </div>
          </div>
        </header>
      </ShopifySectionFrame>

      {/* =====================================================================
         DISTINCT HERO ARCHITECTURE FOR ALL 6 THEMES
         ===================================================================== */}
      <ShopifySectionFrame
        sectionId="hero"
        label="Hero Banner & Main Photo"
        hindiLabel="मेन हीरो फोटो और टेक्स्ट"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'hero'}
        onSelect={onSelectSection}
      >
        {isRoseLuxe ? (
          /* ==============================================================
             THEME 6: ROSÉ LUXE PINK (FROSTED DARK GLASS + SWEEPING WAVE)
             ============================================================== */
          <section
            id="top"
            className="relative overflow-hidden"
            style={{
              backgroundColor: palette.heroBg,
              color: palette.heroText,
            }}
          >
            <div className="absolute inset-0 z-0">
              <SafeSalonImage
                src={heroPhotoSrc}
                fallbackSrc={getRoseLuxeSalonHeroUri()}
                alt={displayName}
                className="w-full h-full object-cover opacity-80"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(28, 16, 23, 0.38) 0%, rgba(18, 10, 15, 0.78) 100%)',
                }}
              />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-28 sm:pt-20 sm:pb-36 flex items-center justify-center">
              <div className="w-full max-w-2xl rounded-3xl backdrop-blur-md bg-[#160d12]/65 border border-white/20 px-6 py-10 sm:px-12 sm:py-12 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                <div
                  className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] mb-3"
                  style={{ color: '#f472b6' }}
                >
                  ✦ {settings.tagline || baseTheme.defaultCopy.tagline} ✦
                </div>

                <h1
                  className="text-3xl sm:text-5xl font-bold leading-tight mb-4 text-white"
                  style={{
                    fontFamily: headingFont,
                    textWrap: 'balance',
                  }}
                >
                  {settings.heroHeadline || baseTheme.defaultCopy.heroHeadline}
                </h1>

                <p className="text-xs sm:text-sm leading-relaxed mb-8 max-w-lg mx-auto text-pink-100/90">
                  {settings.heroSubheadline || baseTheme.defaultCopy.heroSubheadline}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
                  <button
                    onClick={() => {
                      if (!shopifyInspectorActive) handleOpenBooking();
                    }}
                    className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-full transition-transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap shrink-0 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${palette.buttonBg}, #ec4899)`,
                      color: '#ffffff',
                    }}
                  >
                    <span>{settings.heroPrimaryBtnText || 'Book Appointment'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#services"
                    onClick={(e) => {
                      if (shopifyInspectorActive) e.preventDefault();
                    }}
                    className="px-6 py-3 text-xs sm:text-sm font-medium rounded-full border border-white/35 bg-white/10 hover:bg-white/20 text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    {settings.heroSecondaryBtnText || 'Explore Services'}
                  </a>
                </div>

                {showStatsStrip && (
                  <div
                    onClick={(e) => {
                      if (shopifyInspectorActive && onSelectSection) {
                        e.stopPropagation();
                        onSelectSection('stats');
                      }
                    }}
                    className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 text-left sm:text-center max-w-lg mx-auto tabular-nums"
                  >
                    <div className="flex items-center sm:justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm sm:text-base font-bold text-white leading-tight">
                          {settings.stat1Value || '4.9'}
                        </div>
                        <div className="text-[11px] text-pink-200/80">
                          {settings.stat1Label || 'Rating'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-pink-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm sm:text-base font-bold text-white leading-tight">
                          {settings.stat2Value || '5000+'}
                        </div>
                        <div className="text-[11px] text-pink-200/80">
                          {settings.stat2Label || 'Happy Clients'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-pink-400 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm sm:text-base font-bold text-white leading-tight truncate max-w-[110px]">
                          {settings.city ? settings.city.split(',')[0] : 'Ahmedabad'}
                        </div>
                        <div className="text-[11px] text-pink-200/80">
                          {settings.stat3Label || 'Location'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 leading-none pointer-events-none">
              <svg
                viewBox="0 0 1440 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-12 sm:h-20 preserve-3d"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 65 C360 15 720 105 1440 30 L1440 100 L0 100 Z"
                  fill={palette.canvasBg}
                />
              </svg>
            </div>
          </section>
        ) : layoutVariant === 'regal-arch' ? (
          /* ==============================================================
             THEME 3: BRIDAL ROYALE (MAHARANI VELVET BURGUNDY & JHAROKHA ARCH)
             ============================================================== */
          <section
            id="top"
            className="relative overflow-hidden border-b"
            style={{
              backgroundColor: palette.heroBg,
              color: palette.heroText,
              borderColor: palette.borderAccent,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 text-left">
                  <div
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-[0.2em] mb-5"
                    style={{
                      borderColor: palette.accentSecondary,
                      color: palette.accentSecondary,
                      backgroundColor: 'rgba(200, 162, 75, 0.12)',
                    }}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{settings.tagline || baseTheme.defaultCopy.tagline}</span>
                  </div>

                  <h1
                    className={`text-3xl sm:text-5xl font-bold leading-tight mb-6 max-w-2xl ${letterSpacingClass}`}
                    style={{
                      color: palette.heroText,
                      fontFamily: headingFont,
                      textWrap: 'balance',
                    }}
                  >
                    {settings.heroHeadline || baseTheme.defaultCopy.heroHeadline}
                  </h1>

                  <p
                    className="text-sm sm:text-base leading-relaxed mb-8 max-w-xl"
                    style={{ color: palette.heroMuted }}
                  >
                    {settings.heroSubheadline || baseTheme.defaultCopy.heroSubheadline}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => {
                        if (!shopifyInspectorActive) handleOpenBooking();
                      }}
                      className="px-7 py-3.5 text-xs sm:text-sm font-bold rounded-full transition-transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap shrink-0 shadow-lg"
                      style={{
                        backgroundColor: palette.accentSecondary,
                        color: '#2c0912',
                      }}
                    >
                      <span>{settings.heroPrimaryBtnText || 'Book Bridal Consultation'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href="#services"
                      onClick={(e) => {
                        if (shopifyInspectorActive) e.preventDefault();
                      }}
                      className="px-6 py-3.5 text-xs sm:text-sm font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0"
                      style={{
                        borderColor: palette.accentSecondary,
                        color: palette.heroText,
                      }}
                    >
                      {settings.heroSecondaryBtnText || 'View Bridal Packages'}
                    </a>
                  </div>
                </div>

                {/* Royal Indian Jharokha Arch Frame */}
                <div className="lg:col-span-5">
                  <div
                    className="p-3.5 border-2 rounded-t-full rounded-b-2xl shadow-2xl"
                    style={{ borderColor: palette.accentSecondary }}
                  >
                    <div className="overflow-hidden aspect-[4/3] rounded-t-full rounded-b-xl">
                      <SafeSalonImage
                        src={heroPhotoSrc}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {showStatsStrip && (
                <div
                  onClick={(e) => {
                    if (shopifyInspectorActive && onSelectSection) {
                      e.stopPropagation();
                      onSelectSection('stats');
                    }
                  }}
                  className="mt-14 pt-8 border-t grid grid-cols-2 sm:grid-cols-4 gap-6 text-left tabular-nums"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accentSecondary, fontFamily: headingFont }}>
                      {settings.stat1Value || '4.9 ★'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat1Label || 'Bridal & Client Rating'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accentSecondary, fontFamily: headingFont }}>
                      {settings.stat2Value || '5000+'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat2Label || 'Brides & Happy Clients'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accentSecondary, fontFamily: headingFont }}>
                      {settings.stat3Value || '100% HD'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat3Label || 'Waterproof Airbrush Makeup'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accentSecondary, fontFamily: headingFont }}>
                      {settings.city ? settings.city.split(',')[0] : 'VIP Studio'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat4Label || 'Private Bridal Lounge'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : layoutVariant === 'parisian-split' ? (
          /* ==============================================================
             THEME 2: ROSE ELEGANCE (BLUSH ROSE & SILK IVORY ATELIER)
             ============================================================== */
          <section
            id="top"
            className="relative overflow-hidden border-b"
            style={{
              backgroundColor: palette.heroBg,
              color: palette.heroText,
              borderColor: palette.borderSubtle,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-4"
                    style={{
                      backgroundColor: '#ffffff',
                      color: palette.accentPrimary,
                      border: `1px solid ${palette.borderAccent}`,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{settings.tagline || baseTheme.defaultCopy.tagline}</span>
                  </div>

                  <h1
                    className={`text-3xl sm:text-5xl font-bold leading-tight mb-5 ${letterSpacingClass}`}
                    style={{
                      color: palette.heroText,
                      fontFamily: headingFont,
                      textWrap: 'balance',
                    }}
                  >
                    {settings.heroHeadline || baseTheme.defaultCopy.heroHeadline}
                  </h1>

                  <p
                    className="text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
                    style={{ color: palette.heroMuted }}
                  >
                    {settings.heroSubheadline || baseTheme.defaultCopy.heroSubheadline}
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5">
                    <button
                      onClick={() => {
                        if (!shopifyInspectorActive) handleOpenBooking();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-full transition-opacity hover:opacity-90 flex items-center gap-2 shadow-md"
                      style={{
                        backgroundColor: palette.buttonBg,
                        color: palette.buttonText,
                      }}
                    >
                      <span>{settings.heroPrimaryBtnText || 'Book Your Visit'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href="#services"
                      onClick={(e) => {
                        if (shopifyInspectorActive) e.preventDefault();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-full bg-white/80 border transition-colors"
                      style={{
                        borderColor: palette.borderAccent,
                        color: palette.heroText,
                      }}
                    >
                      {settings.heroSecondaryBtnText || 'Explore Menu'}
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-6 relative">
                  <div
                    className="p-3 bg-white/80 rounded-3xl border shadow-xl"
                    style={{ borderColor: palette.borderAccent }}
                  >
                    <div className="rounded-2xl overflow-hidden aspect-[16/10]">
                      <SafeSalonImage
                        src={heroPhotoSrc}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : layoutVariant === 'botanical-grid' ? (
          /* ==============================================================
             THEME 4: EMERALD LUXE (AYURVEDIC BOTANICAL SPA SANCTUARY)
             ============================================================== */
          <section
            id="top"
            className="relative overflow-hidden border-b"
            style={{
              backgroundColor: palette.heroBg,
              color: palette.heroText,
              borderColor: palette.borderSubtle,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6">
                  <div
                    className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: palette.accentSecondary }}
                  >
                    🌿 {settings.tagline || baseTheme.defaultCopy.tagline}
                  </div>
                  <h1
                    className={`text-3xl sm:text-5xl font-bold leading-tight mb-5 ${letterSpacingClass}`}
                    style={{
                      color: palette.heroText,
                      fontFamily: headingFont,
                      textWrap: 'balance',
                    }}
                  >
                    {settings.heroHeadline || baseTheme.defaultCopy.heroHeadline}
                  </h1>
                  <p
                    className="text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
                    style={{ color: palette.heroMuted }}
                  >
                    {settings.heroSubheadline || baseTheme.defaultCopy.heroSubheadline}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => {
                        if (!shopifyInspectorActive) handleOpenBooking();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-bold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2"
                      style={{
                        backgroundColor: palette.accentSecondary,
                        color: '#041f17',
                      }}
                    >
                      <span>{settings.heroPrimaryBtnText || 'Book Spa Ritual'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#services"
                      onClick={(e) => {
                        if (shopifyInspectorActive) e.preventDefault();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-medium rounded-lg border"
                      style={{
                        borderColor: palette.borderAccent,
                        color: palette.heroText,
                      }}
                    >
                      {settings.heroSecondaryBtnText || 'Holistic Menu'}
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div
                    className="p-2.5 rounded-2xl border"
                    style={{ borderColor: palette.accentSecondary }}
                  >
                    <div className="rounded-xl overflow-hidden aspect-[16/10]">
                      <SafeSalonImage
                        src={heroPhotoSrc}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ==============================================================
             THEME 1 (ROYAL GOLD) & THEME 5 (MOCHA SIGNATURE) EDITORIAL HERO
             ============================================================== */
          <section
            id="top"
            className="relative overflow-hidden border-b"
            style={{
              backgroundColor: palette.heroBg,
              color: palette.heroText,
              borderColor: palette.borderSubtle,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 text-left">
                  <div
                    className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
                    style={{ color: palette.accentSecondary }}
                  >
                    ✦ {settings.tagline || baseTheme.defaultCopy.tagline}
                  </div>

                  <h1
                    className={`text-3xl sm:text-5xl font-bold leading-tight mb-6 max-w-2xl ${letterSpacingClass}`}
                    style={{
                      color: palette.heroText,
                      fontFamily: headingFont,
                      textWrap: 'balance',
                    }}
                  >
                    {settings.heroHeadline || baseTheme.defaultCopy.heroHeadline}
                  </h1>

                  <p
                    className="text-sm sm:text-base leading-relaxed mb-8 max-w-xl"
                    style={{ color: palette.heroMuted }}
                  >
                    {settings.heroSubheadline || baseTheme.defaultCopy.heroSubheadline}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => {
                        if (!shopifyInspectorActive) handleOpenBooking();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-bold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2 whitespace-nowrap shrink-0"
                      style={{
                        backgroundColor: palette.accentSecondary,
                        color: '#0c0a09',
                      }}
                    >
                      <span>{settings.heroPrimaryBtnText || 'Book Appointment'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href="#services"
                      onClick={(e) => {
                        if (shopifyInspectorActive) e.preventDefault();
                      }}
                      className="px-6 py-3 text-xs sm:text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0"
                      style={{
                        borderColor: palette.borderAccent,
                        color: palette.heroText,
                      }}
                    >
                      {settings.heroSecondaryBtnText || 'Explore Services'}
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div
                    className="p-3 border rounded-xl"
                    style={{ borderColor: palette.borderAccent }}
                  >
                    <div className="overflow-hidden aspect-[4/3] rounded-lg">
                      <SafeSalonImage
                        src={heroPhotoSrc}
                        fallbackSrc={baseTheme.previewSvgDataUri}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {showStatsStrip && (
                <div
                  onClick={(e) => {
                    if (shopifyInspectorActive && onSelectSection) {
                      e.stopPropagation();
                      onSelectSection('stats');
                    }
                  }}
                  className="mt-14 pt-8 border-t grid grid-cols-2 sm:grid-cols-4 gap-6 text-left tabular-nums"
                  style={{ borderColor: palette.borderSubtle }}
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.heroText, fontFamily: headingFont }}>
                      {settings.stat1Value || '4.9 / 5.0'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat1Label || 'Client Satisfaction Rating'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.heroText, fontFamily: headingFont }}>
                      {settings.stat2Value || '5,000+'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat2Label || 'Happy Clients Served'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.heroText, fontFamily: headingFont }}>
                      {settings.stat3Value || (todayHours?.isOpen ? `${todayHours.openTime}–${todayHours.closeTime}` : 'By Appointment')}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat3Label || `${todayName} Salon Hours`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.heroText, fontFamily: headingFont }}>
                      {settings.city ? settings.city.split(',')[0] : 'Luxury Studio'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: palette.heroMuted }}>
                      {settings.stat4Label || 'Verified Salon Sanctuary'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </ShopifySectionFrame>

      {/* ==============================================================
         REORDERABLE MAIN BODY SECTIONS (SHOPIFY ONLINE STORE 2.0 ENGINE)
         ============================================================== */}
      {effectiveSectionOrder.map((secId, secIndex) => {
        switch (secId) {
          case 'services':
            return renderServicesSection(secIndex);
          case 'why-choose-us':
            return renderWhyChooseUsSection(secIndex);
          case 'about':
            return renderAboutSection(secIndex);
          case 'gallery':
            return renderGallerySection(secIndex);
          case 'reviews':
            return renderReviewsSection(secIndex);
          case 'hours':
            return renderHoursSection(secIndex);
          default:
            return null;
        }
      })}

      {/* Clean Own-Brand Footer (Zero Third-Party or Platform Branding!) */}
      <ShopifySectionFrame
        sectionId="footer"
        label="Footer & Social Links"
        hindiLabel="फुटर और सोशल मीडिया"
        active={shopifyInspectorActive}
        isSelected={selectedSectionId === 'footer'}
        onSelect={onSelectSection}
      >
        <footer
          className="text-xs py-10 border-t"
          style={{
            backgroundColor: palette.footerBg,
            color: palette.footerText,
            borderColor: palette.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="font-bold text-sm" style={{ color: '#ffffff', fontFamily: headingFont }}>
                {displayName}
              </span>
              {settings.footerTagline && (
                <>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>{settings.footerTagline}</span>
                </>
              )}
              <p className="mt-1 opacity-75">
                © {new Date().getFullYear()} {displayName}. All Rights Reserved.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="hover:underline">
                  {settings.phone}
                </a>
              )}
              {onOpenOwnerLogin && !isEmbeddedPreview && (
                <button
                  onClick={onOpenOwnerLogin}
                  className="hover:underline whitespace-nowrap shrink-0 opacity-75 hover:opacity-100"
                >
                  Partner Login
                </button>
              )}
            </div>
          </div>
        </footer>
      </ShopifySectionFrame>

      {/* Persistent Appointment Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-neutral-900 rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative my-8">
            <button
              onClick={() => {
                setIsBookingOpen(false);
                setBookingSuccess(null);
                setBookingError(null);
              }}
              aria-label="Close modal"
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-neutral-900 mb-2">
                  Appointment Request Recorded
                </h3>
                <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
                  Your booking request is saved with status{' '}
                  <strong className="text-amber-800 font-semibold">Pending</strong>. Our salon team will confirm your
                  slot shortly.
                </p>

                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-left text-xs space-y-2 mb-6 tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-neutral-900">{bookingSuccess.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Selected Treatment:</span>
                    <span className="font-medium text-neutral-900">{bookingSuccess.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Requested Date & Time:</span>
                    <span className="font-medium text-neutral-900">
                      {bookingSuccess.appointment_date} · {bookingSuccess.appointment_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Treatment Rate:</span>
                    <span className="font-bold text-neutral-900">
                      {settings.currency || '₹'}
                      {bookingSuccess.service_price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsBookingOpen(false);
                    setBookingSuccess(null);
                  }}
                  className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="text-xs font-medium text-neutral-500">
                    {displayName} · Online Reservation
                  </div>
                  <h3 className="text-xl font-serif font-bold text-neutral-900 mt-1">
                    Request an Appointment
                  </h3>
                </div>

                {bookingError && (
                  <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Select Service *
                    </label>
                    <select
                      value={selectedService?.id || ''}
                      onChange={(e) => {
                        const found = services.find((s) => s.id === e.target.value);
                        if (found) setSelectedService(found);
                      }}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({settings.currency || '₹'}
                          {s.price} · {s.duration_minutes} mins)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Preferred Time *
                      </label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 tabular-nums"
                      >
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Contact Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="client@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Notes or Styling Preferences
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any specific preferences or consultation details..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="w-full py-3 px-4 rounded-lg font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        backgroundColor: palette.buttonBg,
                        color: palette.buttonText,
                      }}
                    >
                      {bookingSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Appointment Request...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          <span>Submit Appointment Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Image Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="max-w-2xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveImageModal(null)}
              aria-label="Close preview"
              className="absolute -top-10 right-0 text-white hover:text-neutral-300"
            >
              <X className="w-6 h-6" />
            </button>
            <SafeSalonImage
              src={
                activeImageModal.image_url && !activeImageModal.image_url.includes('images.unsplash.com')
                  ? activeImageModal.image_url
                  : getGalleryArtworkDataUri(activeImageModal.title, activeImageModal.category, baseTheme)
              }
              fallbackSrc={baseTheme.previewSvgDataUri}
              alt={activeImageModal.title}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <div className="text-white mt-3 text-center">
              <div className="text-xs opacity-75">{activeImageModal.category}</div>
              <h4 className="text-base font-serif font-bold mt-0.5">{activeImageModal.title}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Floating Share & Live Theme Switcher Bar ONLY when viewing a Marketing Theme Share Link */}
      {!isEmbeddedPreview && isMarketingShareMode && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-40 flex flex-wrap items-center justify-end gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-neutral-950/95 backdrop-blur-md text-white border border-white/15 rounded-2xl px-3.5 py-2.5 shadow-2xl flex flex-wrap items-center gap-2.5 text-xs">
            {onChangeMarketingTheme && (
              <div className="flex items-center gap-1.5 pr-2 border-r border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-neutral-300 hidden md:inline">Switch Theme (6):</span>
                <select
                  value={activeThemeId}
                  onChange={(e) => onChangeMarketingTheme(e.target.value as RoyalThemeId)}
                  className="bg-neutral-900 border border-neutral-700 text-amber-300 font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  {ROYAL_THEME_LIST.map((t, i) => (
                    <option key={t.id} value={t.id}>
                      {i + 1}. {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const shareUrl = `${window.location.origin}${window.location.pathname}?theme=${encodeURIComponent(activeThemeId)}`;
                navigator.clipboard.writeText(shareUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                shareCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
              }`}
            >
              <span>{shareCopied ? '✓ Theme Link Copied!' : 'Copy Shareable Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const shareUrl = `${window.location.origin}${window.location.pathname}?theme=${encodeURIComponent(activeThemeId)}`;
                const msg = `✨ *${baseTheme.name} — Luxury Salon & Bridal Website Theme*\n\nइस प्रीमियम सैलून थीम का लाइव डेमो यहाँ देखें:\n👉 ${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors cursor-pointer"
            >
              WhatsApp Share
            </button>
          </div>
        </div>
      )}
      {/* Shopify Online Store 2.0 Click-to-Edit Modal */}
      {inlineEditModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-serif font-bold text-neutral-900">{inlineEditModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInlineEditModal(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inlineEditModal.type === 'photo' ? (
              <div className="space-y-4">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                  <div className="text-xs font-semibold text-neutral-700 mb-2">Upload Photo from Phone / PC</div>
                  <label className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold cursor-pointer inline-flex items-center gap-2 text-xs">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          applyInlineSave(String(reader.result));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-600">Or Pick from Indian Salon Photo Library:</div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {INDIAN_SALON_PHOTO_LIBRARY.slice(0, 9).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyInlineSave(preset.imageUrl)}
                        className="aspect-[4/3] rounded-lg overflow-hidden border hover:border-blue-600 transition-all relative group"
                      >
                        <img src={preset.imageUrl} alt={preset.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium p-1 text-center transition-opacity">
                          {preset.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Update Text:</label>
                  {inlineEditModal.isTextarea ? (
                    <textarea
                      rows={3}
                      defaultValue={inlineEditModal.currentValue}
                      id="inline-edit-input-val"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      defaultValue={inlineEditModal.currentValue}
                      id="inline-edit-input-val"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInlineEditModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('inline-edit-input-val') as HTMLInputElement | HTMLTextAreaElement;
                      if (el && onUpdateSettings) {
                        onUpdateSettings({ [inlineEditModal.settingKey]: el.value });
                      }
                      setInlineEditModal(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    Save & Update Live
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

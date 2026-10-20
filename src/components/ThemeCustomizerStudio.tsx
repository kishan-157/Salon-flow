import React, { useState, useEffect } from 'react';
import {
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Type,
  Palette,
  Layout,
  Clock,
  Star,
  Plus,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  Camera,
  Layers,
  Sliders,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Megaphone,
  PanelTop,
  PanelBottom,
  Award,
  HeartHandshake,
  Briefcase,
} from 'lucide-react';
import {
  RoyalThemeId,
  TenantSettings,
  GalleryItem,
  Review,
  OpeningHour,
  CustomThemeColors,
  Service,
} from '../types/saas.ts';
import {
  ROYAL_THEMES,
  ALLOWED_ROYAL_THEMES,
  resolveSafeThemeId,
  getRoseLuxeSalonHeroUri,
} from '../config/themes.ts';
import {
  INDIAN_SALON_PHOTO_LIBRARY,
  IndianSalonPhotoPreset,
} from '../config/indianPhotoLibrary.ts';
import { saasApi } from '../services/api.ts';
import {
  PublicSalonSite,
  EditableWebsiteSectionId,
  DEFAULT_SECTION_ORDER,
} from './PublicSalonSite.tsx';

interface ThemeCustomizerStudioProps {
  tenantId: string;
  tenantSlug: string;
  initialSalonName: string;
  initialSettings: TenantSettings;
  gallery: GalleryItem[];
  onSaved: (newSalonName: string, updatedSettings: TenantSettings) => void;
  onGalleryChanged: () => Promise<void>;
  onViewPublicSite: (slug: string) => void;
  initialSubTab?: 'themes' | 'photos' | 'typography' | 'layout' | 'hours' | 'reviews';
}

type InspectorTarget =
  | EditableWebsiteSectionId
  | 'themes'
  | 'colors'
  | 'typography'
  | 'layout';

const HEADING_FONT_OPTIONS = [
  { label: 'Playfair Display (Luxury Serif)', value: "'Playfair Display', Georgia, serif" },
  { label: 'Cormorant Garamond (Couture Editorial)', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Cinzel (Imperial Roman Capitals)', value: "'Cinzel', Georgia, serif" },
  { label: 'Lora (Warm Contemporary Serif)', value: "'Lora', Georgia, serif" },
  { label: 'Plus Jakarta Sans (Modern Architectural)', value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: 'Georgia (Classic Heritage)', value: 'Georgia, serif' },
];

const BODY_FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Clean Modern Sans)', value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: 'Lora (Editorial Serif Body)', value: "'Lora', Georgia, serif" },
  { label: 'Cormorant Garamond (Refined Atelier)', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'System UI Sans (Ultra Crisp)', value: 'system-ui, -apple-system, sans-serif' },
];

const DEFAULT_DAYS: OpeningHour[] = [
  { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
  { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
  { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
  { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
];

const SECTION_META: Record<
  EditableWebsiteSectionId,
  { title: string; hindi: string; icon: React.ComponentType<{ className?: string }> }
> = {
  announcement: { title: 'Announcement Bar', hindi: 'टॉप ऑफर बैनर', icon: Megaphone },
  header: { title: 'Header & Brand Logo', hindi: 'हेडर, नाम और लोगो', icon: PanelTop },
  hero: { title: 'Hero Banner & Photo', hindi: 'मेन हीरो फोटो और टेक्स्ट', icon: Sparkles },
  stats: { title: 'Trust Stats Strip', hindi: 'रेटिंग और आंकड़े', icon: Award },
  services: { title: 'Services & Pricing', hindi: 'सर्विसेज और प्राइस कार्ड', icon: Briefcase },
  'why-choose-us': { title: 'Why Choose Us', hindi: 'क्यों चुनें हमें (4 कार्ड)', icon: HeartHandshake },
  about: { title: 'About Salon Story', hindi: 'हमारे बारे में और फोटो', icon: ImageIcon },
  gallery: { title: 'Indian Photo Gallery', hindi: 'इंडियन लुक फोटो गैलरी', icon: Camera },
  reviews: { title: 'Client Testimonials', hindi: 'ग्राहक रिव्यु', icon: Star },
  hours: { title: 'Hours & Location', hindi: 'समय और पता', icon: Clock },
  footer: { title: 'Footer & Socials', hindi: 'फुटर और सोशल मीडिया', icon: PanelBottom },
};

/**
 * Compresses & converts an uploaded image file into a clean Data URI
 * so salon owners can upload any photo directly from their phone or computer.
 */
function processImageFileToDataUri(file: File, maxWidth = 1200, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ThemeCustomizerStudio: React.FC<ThemeCustomizerStudioProps> = ({
  tenantId,
  tenantSlug,
  initialSalonName,
  initialSettings,
  gallery,
  onSaved,
  onGalleryChanged,
  onViewPublicSite,
  initialSubTab = 'themes',
}) => {
  // Map legacy initialSubTab onto Shopify-style left sidebar mode & active inspector target
  const mapSubTabToTarget = (
    tab: 'themes' | 'photos' | 'typography' | 'layout' | 'hours' | 'reviews'
  ): { sidebarMode: 'sections' | 'settings'; target: InspectorTarget } => {
    switch (tab) {
      case 'photos':
        return { sidebarMode: 'sections', target: 'hero' };
      case 'typography':
        return { sidebarMode: 'settings', target: 'typography' };
      case 'layout':
        return { sidebarMode: 'sections', target: 'services' };
      case 'hours':
        return { sidebarMode: 'sections', target: 'hours' };
      case 'reviews':
        return { sidebarMode: 'sections', target: 'reviews' };
      case 'themes':
      default:
        return { sidebarMode: 'sections', target: 'hero' };
    }
  };

  const initialMapped = mapSubTabToTarget(initialSubTab);
  const [leftSidebarMode, setLeftSidebarMode] = useState<'sections' | 'settings'>(
    initialMapped.sidebarMode
  );
  const [selectedTarget, setSelectedTarget] = useState<InspectorTarget>(initialMapped.target);
  const [shopifyInspectorEnabled, setShopifyInspectorEnabled] = useState<boolean>(true);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState<boolean>(false);

  const [salonName, setSalonName] = useState<string>(initialSalonName);
  const [settings, setSettings] = useState<TenantSettings>(() => ({
    ...initialSettings,
    themeId: resolveSafeThemeId(initialSettings?.themeId, 'royal-gold'),
    openingHours:
      initialSettings?.openingHours && initialSettings.openingHours.length > 0
        ? initialSettings.openingHours
        : DEFAULT_DAYS,
    customColors: initialSettings?.customColors || {},
    sectionOrder:
      initialSettings?.sectionOrder && initialSettings.sectionOrder.length > 0
        ? initialSettings.sectionOrder
        : DEFAULT_SECTION_ORDER,
  }));

  // Undo / Redo History Stack for Shopify-like editing confidence
  const [history, setHistory] = useState<TenantSettings[]>([]);
  const [future, setFuture] = useState<TenantSettings[]>([]);

  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewRefreshCount, setPreviewRefreshCount] = useState<number>(0);

  // Gallery item add/edit state
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('Bridal & Styling');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [galleryBusy, setGalleryBusy] = useState(false);

  // Reviews management state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewTag, setNewReviewTag] = useState('Bridal Styling');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewsBusy, setReviewsBusy] = useState(false);

  // Services state for photo inspector
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadOwnerServicesList();
  }, [tenantId]);

  const loadOwnerServicesList = async () => {
    try {
      const list = await saasApi.getOwnerServices(tenantId);
      setServices(list);
    } catch {
      setServices([]);
    }
  };

  useEffect(() => {
    const mapped = mapSubTabToTarget(initialSubTab);
    setLeftSidebarMode(mapped.sidebarMode);
    setSelectedTarget(mapped.target);
  }, [initialSubTab]);

  useEffect(() => {
    setSalonName(initialSalonName);
    setSettings({
      ...initialSettings,
      themeId: resolveSafeThemeId(initialSettings?.themeId, 'royal-gold'),
      openingHours:
        initialSettings?.openingHours && initialSettings.openingHours.length > 0
          ? initialSettings.openingHours
          : DEFAULT_DAYS,
      customColors: initialSettings?.customColors || {},
      sectionOrder:
        initialSettings?.sectionOrder && initialSettings.sectionOrder.length > 0
          ? initialSettings.sectionOrder
          : DEFAULT_SECTION_ORDER,
    });
  }, [initialSalonName, initialSettings]);

  useEffect(() => {
    loadOwnerReviews();
  }, [tenantId]);

  const loadOwnerReviews = async () => {
    try {
      const list = await saasApi.getOwnerReviews(tenantId);
      setReviews(list);
    } catch {
      // ignore
    }
  };

  const activeThemeId: RoyalThemeId = resolveSafeThemeId(settings.themeId, 'royal-gold');
  const activeThemeTokens = ROYAL_THEMES[activeThemeId];

  const pushSettingsUpdate = (updater: (prev: TenantSettings) => TenantSettings) => {
    setSettings((prev) => {
      setHistory((h) => [...h.slice(-18), prev]);
      setFuture([]);
      return updater(prev);
    });
  };

  const updateField = <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => {
    pushSettingsUpdate((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [settings, ...f]);
    setSettings(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, settings]);
    setSettings(next);
  };

  const updateCustomColor = (colorKey: keyof CustomThemeColors, hexValue: string) => {
    pushSettingsUpdate((prev) => ({
      ...prev,
      customColors: {
        ...(prev.customColors || {}),
        [colorKey]: hexValue,
      },
    }));
  };

  const handleResetCustomColors = () => {
    pushSettingsUpdate((prev) => ({
      ...prev,
      customColors: {},
    }));
    setSuccessMsg(`Colors reset to default ${activeThemeTokens.name} palette. Click 'Save & Publish' to make live.`);
  };

  // Reorder template sections in Shopify Section Tree
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

  const moveSectionOrder = (secId: EditableWebsiteSectionId, direction: 'up' | 'down') => {
    const idx = effectiveSectionOrder.indexOf(secId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= effectiveSectionOrder.length) return;
    const nextOrder = [...effectiveSectionOrder];
    const [removed] = nextOrder.splice(idx, 1);
    nextOrder.splice(targetIdx, 0, removed);
    updateField('sectionOrder', nextOrder);
  };

  const isSectionVisible = (secId: EditableWebsiteSectionId): boolean => {
    switch (secId) {
      case 'announcement':
        return settings.showNoticeBanner !== false && Boolean(settings.noticeBanner);
      case 'stats':
        return settings.showStatsStrip !== false;
      case 'why-choose-us':
        return settings.showWhyChooseUs !== undefined
          ? settings.showWhyChooseUs
          : activeThemeId === 'rose-luxe' || settings.layoutVariant === 'rose-luxe-pink';
      case 'about':
        return settings.showAboutSection !== false;
      case 'gallery':
        return settings.showGallerySection !== false;
      case 'reviews':
        return settings.showReviewsSection !== false;
      case 'hours':
        return settings.showHoursSection !== false;
      default:
        return true;
    }
  };

  const toggleSectionVisibility = (secId: EditableWebsiteSectionId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentlyVisible = isSectionVisible(secId);
    switch (secId) {
      case 'announcement':
        if (!currentlyVisible && !settings.noticeBanner) {
          updateField('noticeBanner', '✨ Bridal & Festive Season Offer: Flat 20% Off on Advance Bookings!');
        }
        updateField('showNoticeBanner', !currentlyVisible);
        break;
      case 'stats':
        updateField('showStatsStrip', !currentlyVisible);
        break;
      case 'why-choose-us':
        updateField('showWhyChooseUs', !currentlyVisible);
        break;
      case 'about':
        updateField('showAboutSection', !currentlyVisible);
        break;
      case 'gallery':
        updateField('showGallerySection', !currentlyVisible);
        break;
      case 'reviews':
        updateField('showReviewsSection', !currentlyVisible);
        break;
      case 'hours':
        updateField('showHoursSection', !currentlyVisible);
        break;
      default:
        break;
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUri: string) => void,
    maxW = 1200
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUri = await processImageFileToDataUri(file, maxW);
      onResult(dataUri);
      setSuccessMsg(`Photo '${file.name}' loaded into live preview! Click 'Save & Publish' to save permanently.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not process image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveAllChanges = async (overrideTheme?: RoyalThemeId) => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payloadSettings: TenantSettings = {
      ...settings,
      themeId: overrideTheme || activeThemeId,
    };

    try {
      const res = await saasApi.updateOwnerSettings(tenantId, payloadSettings, salonName);
      const updated = res.settings || payloadSettings;
      setSettings(updated);
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg(
        `Published! Your website (${tenantSlug}.glamhub.com) is now live with the ${
          ROYAL_THEMES[(updated.themeId || activeThemeId) as RoyalThemeId].name
        } theme and all custom edits.`
      );
      onSaved(salonName, updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save website customization.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrUpdateGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle.trim() || !newGalleryUrl.trim()) {
      setErrorMsg('Please provide both a photo title and an uploaded photo or image URL.');
      return;
    }
    setGalleryBusy(true);
    setErrorMsg(null);
    try {
      if (editingGalleryItem) {
        await saasApi.updateGalleryItem(tenantId, editingGalleryItem.id, {
          title: newGalleryTitle.trim(),
          category: newGalleryCategory.trim() || 'Portfolio',
          image_url: newGalleryUrl.trim(),
        });
        setSuccessMsg(`Updated gallery photo '${newGalleryTitle}'.`);
      } else {
        await saasApi.createGalleryItem(tenantId, {
          title: newGalleryTitle.trim(),
          category: newGalleryCategory.trim() || 'Portfolio',
          image_url: newGalleryUrl.trim(),
        });
        setSuccessMsg(`Added new photo '${newGalleryTitle}' to your live website gallery.`);
      }
      setEditingGalleryItem(null);
      setNewGalleryTitle('');
      setNewGalleryUrl('');
      await onGalleryChanged();
      setPreviewRefreshCount((c) => c + 1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save gallery photo.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    setGalleryBusy(true);
    setErrorMsg(null);
    try {
      await saasApi.deleteGalleryItem(tenantId, id);
      await onGalleryChanged();
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg('Photo removed from website gallery.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete gallery photo.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleQuickAddPresetToGallery = async (preset: IndianSalonPhotoPreset) => {
    setGalleryBusy(true);
    setErrorMsg(null);
    try {
      await saasApi.createGalleryItem(tenantId, {
        title: preset.title,
        category: preset.category,
        image_url: preset.imageUrl,
      });
      await onGalleryChanged();
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg(`Added '${preset.title}' (${preset.hindiTitle}) to your live Website Gallery!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not add photo to gallery.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleDirectMobileGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryBusy(true);
    setErrorMsg(null);
    try {
      const dataUri = await processImageFileToDataUri(file, 1100);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Indian Salon Look';
      await saasApi.createGalleryItem(tenantId, {
        title: cleanName,
        category: 'Bridal & Styling',
        image_url: dataUri,
      });
      await onGalleryChanged();
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg(`Uploaded '${cleanName}' from your phone directly into the live Website Gallery!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload photo from mobile.');
    } finally {
      setGalleryBusy(false);
      e.target.value = '';
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) {
      setErrorMsg('Please enter client name and review text.');
      return;
    }
    setReviewsBusy(true);
    setErrorMsg(null);
    try {
      await saasApi.createReview(tenantId, {
        author_name: newReviewAuthor.trim(),
        rating: newReviewRating,
        service_tag: newReviewTag.trim() || 'Signature Service',
        comment: newReviewComment.trim(),
      });
      setNewReviewAuthor('');
      setNewReviewComment('');
      await loadOwnerReviews();
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg('Client testimonial added to website.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add testimonial.');
    } finally {
      setReviewsBusy(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setReviewsBusy(true);
    try {
      await saasApi.deleteReview(tenantId, reviewId);
      await loadOwnerReviews();
      setPreviewRefreshCount((c) => c + 1);
      setSuccessMsg('Testimonial removed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove testimonial.');
    } finally {
      setReviewsBusy(false);
    }
  };

  const handleUpdateOpeningHour = (idx: number, patch: Partial<OpeningHour>) => {
    const updatedHours = [...(settings.openingHours || DEFAULT_DAYS)];
    updatedHours[idx] = { ...updatedHours[idx], ...patch };
    updateField('openingHours', updatedHours);
  };

  // Effective colors for color pickers
  const effectiveColors = {
    canvasBg: settings.customColors?.canvasBg || activeThemeTokens.palette.canvasBg,
    surfaceBg: settings.customColors?.surfaceBg || activeThemeTokens.palette.surfaceBg,
    heroBg: settings.customColors?.heroBg || activeThemeTokens.palette.heroBg,
    heroText: settings.customColors?.heroText || activeThemeTokens.palette.heroText,
    textPrimary: settings.customColors?.textPrimary || activeThemeTokens.palette.textPrimary,
    accentPrimary: settings.customColors?.accentPrimary || activeThemeTokens.palette.accentPrimary,
    accentSecondary: settings.customColors?.accentSecondary || activeThemeTokens.palette.accentSecondary,
    buttonBg: settings.customColors?.buttonBg || activeThemeTokens.palette.buttonBg,
    buttonText: settings.customColors?.buttonText || activeThemeTokens.palette.buttonText,
    footerBg: settings.customColors?.footerBg || activeThemeTokens.palette.footerBg,
  };

  // Reusable Compact Indian Photo Picker Strip inside any photo section inspector
  const renderIndianPhotoQuickPicker = (
    onPickUrl: (url: string, title: string) => void,
    label = 'Or Pick from Pre-Uploaded Indian Look Library (1-Click):'
  ) => (
    <div className="mt-3 pt-3 border-t border-neutral-200">
      <div className="text-[11px] font-bold text-amber-900 mb-2 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
        {INDIAN_SALON_PHOTO_LIBRARY.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPickUrl(preset.imageUrl, preset.title)}
            className="group rounded-lg overflow-hidden border border-neutral-200 hover:border-pink-600 text-left bg-white transition-all flex flex-col"
            title={`${preset.title} (${preset.hindiTitle})`}
          >
            <div className="aspect-[16/10] bg-neutral-900 overflow-hidden w-full">
              <img
                src={preset.imageUrl}
                alt={preset.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-1.5 text-[10px] font-semibold text-neutral-800 truncate w-full">
              {preset.hindiTitle}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={
        isFullscreenEditor
          ? 'fixed inset-0 z-50 bg-neutral-100 flex flex-col overflow-hidden'
          : 'bg-white rounded-2xl border border-neutral-300 shadow-lg overflow-hidden flex flex-col'
      }
      style={{ minHeight: isFullscreenEditor ? '100vh' : '860px' }}
    >
      {/* =====================================================================
         1. SHOPIFY ONLINE STORE 2.0 TOP CHROME BAR
         ===================================================================== */}
      <div className="bg-neutral-950 text-white px-4 py-2.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Store Identity + Active Theme Switcher (All 6 Themes!) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Shopify-Style Theme Studio</span>
                <span className="px-2 py-0.5 rounded bg-pink-600/30 border border-pink-500/40 text-pink-300 text-[10px] font-semibold">
                  OS 2.0 Visual Editor
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {salonName} · {tenantSlug}.glamhub.com
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

          {/* Quick Theme Selector Dropdown for all 6 Themes */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="text-[11px] text-neutral-400 hidden md:inline">Theme (6):</span>
            <select
              value={activeThemeId}
              onChange={(e) => {
                const nextTheme = e.target.value as RoyalThemeId;
                const nextTokens = ROYAL_THEMES[nextTheme];
                pushSettingsUpdate((prev) => ({
                  ...prev,
                  themeId: nextTheme,
                  layoutVariant: nextTokens.layoutVariant,
                }));
              }}
              aria-label="Select active theme"
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {ALLOWED_ROYAL_THEMES.map((tId, idx) => (
                <option key={tId} value={tId} className="bg-neutral-900 text-white">
                  {idx + 1}. {ROYAL_THEMES[tId].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Click-to-Edit Inspector Toggle + Viewport Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShopifyInspectorEnabled((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              shopifyInspectorEnabled
                ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title="Click directly on any section of the live website preview to edit it"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Click-to-Edit: {shopifyInspectorEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('tablet')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                viewportMode === 'tablet'
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile Phone View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreenEditor((v) => !v)}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-700"
            title={isFullscreenEditor ? 'Exit Fullscreen' : 'Fullscreen Shopify Editor'}
          >
            {isFullscreenEditor ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Undo / Redo + View Live + Save & Publish */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900 rounded-lg border border-neutral-800 p-0.5">
            <button
              type="button"
              disabled={history.length === 0}
              onClick={handleUndo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-35"
              title="Undo change"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              onClick={handleRedo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-35"
              title="Redo change"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onViewPublicSite(tenantSlug)}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">Live Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveAllChanges()}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {/* Status Toast Bar */}
      {(errorMsg || successMsg) && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b shrink-0 ${
            errorMsg
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {errorMsg ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span className="font-medium">{errorMsg || successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
         2. SHOPIFY 3-PANE WORKSPACE:
            [LEFT: SECTION TREE & THEME SETTINGS] | [CENTER: LIVE INTERACTIVE CANVAS] | [RIGHT: PROPERTY INSPECTOR]
         ===================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* =================================================================
           LEFT PANE (3 Cols on lg): SHOPIFY SECTION TREE & GLOBAL SETTINGS
           ================================================================= */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-50 flex flex-col h-[420px] lg:h-[820px] overflow-hidden">
          {/* Mode Switcher: Sections vs Theme Settings */}
          <div className="p-2.5 bg-white border-b border-neutral-200 grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLeftSidebarMode('sections');
                if (['themes', 'colors', 'typography', 'layout'].includes(selectedTarget)) {
                  setSelectedTarget('hero');
                }
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                leftSidebarMode === 'sections'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sections (पेज सेक्शन)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLeftSidebarMode('settings');
                setSelectedTarget('themes');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                leftSidebarMode === 'settings'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>6 Themes & Colors</span>
            </button>
          </div>

          {/* Left Tree Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {leftSidebarMode === 'sections' ? (
              <>
                {/* Group 1: Header & Announcement */}
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Header & Top Bar
                  </div>
                  <div className="space-y-1">
                    {(['announcement', 'header'] as EditableWebsiteSectionId[]).map((secId) => {
                      const meta = SECTION_META[secId];
                      const IconComp = meta.icon;
                      const isSel = selectedTarget === secId;
                      const visible = isSectionVisible(secId);

                      return (
                        <div
                          key={secId}
                          onClick={() => setSelectedTarget(secId)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                            isSel
                              ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                              : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <IconComp
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSel ? 'text-blue-600' : 'text-neutral-500'
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate">{meta.title}</div>
                              <div className="text-[10px] text-neutral-400 truncate">{meta.hindi}</div>
                            </div>
                          </div>

                          {secId === 'announcement' && (
                            <button
                              type="button"
                              onClick={(e) => toggleSectionVisibility(secId, e)}
                              className={`p-1 rounded hover:bg-neutral-200/70 ${
                                visible ? 'text-emerald-600' : 'text-neutral-400'
                              }`}
                              title={visible ? 'Hide Section' : 'Show Section'}
                            >
                              {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group 2: Hero Showcase */}
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Hero Showcase
                  </div>
                  <div className="space-y-1">
                    {(['hero', 'stats'] as EditableWebsiteSectionId[]).map((secId) => {
                      const meta = SECTION_META[secId];
                      const IconComp = meta.icon;
                      const isSel = selectedTarget === secId;
                      const visible = isSectionVisible(secId);

                      return (
                        <div
                          key={secId}
                          onClick={() => setSelectedTarget(secId)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                            isSel
                              ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                              : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <IconComp
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSel ? 'text-blue-600' : 'text-neutral-500'
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate">{meta.title}</div>
                              <div className="text-[10px] text-neutral-400 truncate">{meta.hindi}</div>
                            </div>
                          </div>

                          {secId === 'stats' && (
                            <button
                              type="button"
                              onClick={(e) => toggleSectionVisibility(secId, e)}
                              className={`p-1 rounded hover:bg-neutral-200/70 ${
                                visible ? 'text-emerald-600' : 'text-neutral-400'
                              }`}
                              title={visible ? 'Hide Stats Strip' : 'Show Stats Strip'}
                            >
                              {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group 3: Reorderable Main Page Sections (Shopify Template Tree) */}
                <div>
                  <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <span>Template Sections (↑↓ आर्डर बदलें)</span>
                  </div>
                  <div className="space-y-1.5">
                    {effectiveSectionOrder.map((secId, index) => {
                      const meta = SECTION_META[secId];
                      const IconComp = meta.icon;
                      const isSel = selectedTarget === secId;
                      const visible = isSectionVisible(secId);

                      return (
                        <div
                          key={secId}
                          onClick={() => setSelectedTarget(secId)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                            isSel
                              ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                              : visible
                              ? 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
                              : 'bg-neutral-100/70 border-neutral-200/50 text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <IconComp
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSel ? 'text-blue-600' : visible ? 'text-neutral-500' : 'text-neutral-400'
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate">{meta.title}</div>
                              <div className="text-[10px] text-neutral-400 truncate">{meta.hindi}</div>
                            </div>
                          </div>

                          {/* Reorder Up/Down + Eye Visibility Controls */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(secId, 'up');
                              }}
                              className="p-1 rounded hover:bg-neutral-200/70 text-neutral-500 disabled:opacity-25"
                              title="Move Section Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === effectiveSectionOrder.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(secId, 'down');
                              }}
                              className="p-1 rounded hover:bg-neutral-200/70 text-neutral-500 disabled:opacity-25"
                              title="Move Section Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {secId !== 'services' && (
                              <button
                                type="button"
                                onClick={(e) => toggleSectionVisibility(secId, e)}
                                className={`p-1 rounded hover:bg-neutral-200/70 ${
                                  visible ? 'text-emerald-600' : 'text-neutral-400'
                                }`}
                                title={visible ? 'Hide Section' : 'Show Section'}
                              >
                                {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group 4: Footer */}
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Footer
                  </div>
                  <div
                    onClick={() => setSelectedTarget('footer')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      selectedTarget === 'footer'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                        : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PanelBottom
                        className={`w-3.5 h-3.5 ${
                          selectedTarget === 'footer' ? 'text-blue-600' : 'text-neutral-500'
                        }`}
                      />
                      <div>
                        <div>Footer & Social Links</div>
                        <div className="text-[10px] text-neutral-400">फुटर और सोशल मीडिया</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Global Theme Settings Menu */
              <div className="space-y-1.5">
                <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Global Theme Settings
                </div>
                {[
                  {
                    id: 'themes' as InspectorTarget,
                    title: '6 Royal & Luxe Themes',
                    hindi: '6 प्रीमियम थीम चुनें (Rosé Luxe सहित)',
                    icon: Sparkles,
                  },
                  {
                    id: 'colors' as InspectorTarget,
                    title: 'Color Palette (10 Tokens)',
                    hindi: 'बैकग्राउंड, बटन और टेक्स्ट कलर',
                    icon: Palette,
                  },
                  {
                    id: 'typography' as InspectorTarget,
                    title: 'Typography & Fonts',
                    hindi: 'हेडिंग और बॉडी फॉन्ट स्टाइल',
                    icon: Type,
                  },
                  {
                    id: 'layout' as InspectorTarget,
                    title: 'Layout & Card Style',
                    hindi: 'हीरो और सर्विस कार्ड डिज़ाइन',
                    icon: Layout,
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSel = selectedTarget === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTarget(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                        isSel
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${isSel ? 'text-blue-600' : 'text-neutral-500'}`} />
                      <div>
                        <div>{item.title}</div>
                        <div className="text-[10px] text-neutral-400">{item.hindi}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
           CENTER PANE (5 Cols on lg): INTERACTIVE LIVE WEBSITE PREVIEW CANVAS
           ================================================================= */}
        <div className="lg:col-span-5 bg-neutral-200/80 flex flex-col h-[560px] lg:h-[820px] overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-200">
          {/* Interactive Canvas Subbar */}
          <div className="px-3.5 py-2 bg-neutral-900/95 text-neutral-200 text-[11px] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <MousePointerClick className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">
                <strong>Tip:</strong> वेबसाइट के किसी भी हिस्से (फोटो, टेक्स्ट, सर्विस) पर क्लिक करें, दाईं तरफ उसकी एडिटिंग खुल जाएगी!
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-semibold shrink-0">
              {activeThemeTokens.name}
            </span>
          </div>

          {/* Scrollable Live Website Stage */}
          <div className="flex-1 p-2 sm:p-4 overflow-auto flex justify-center items-start">
            <div
              className={`bg-white rounded-xl border border-neutral-300 shadow-xl overflow-hidden transition-all duration-200 ${
                viewportMode === 'mobile'
                  ? 'w-[390px] max-w-full'
                  : viewportMode === 'tablet'
                  ? 'w-[768px] max-w-full'
                  : 'w-full'
              }`}
            >
              <PublicSalonSite
                slug={tenantSlug}
                overrideThemeId={activeThemeId}
                overrideSettings={settings}
                overrideSalonName={salonName}
                overrideServices={services}
                previewMode={viewportMode === 'mobile' ? 'mobile' : 'desktop'}
                isEmbeddedPreview={true}
                refreshTrigger={previewRefreshCount}
                shopifyInspectorActive={shopifyInspectorEnabled}
                selectedSectionId={selectedTarget}
                onSelectSection={(secId) => {
                  setSelectedTarget(secId);
                }}
                onUpdateSettings={(patch) => {
                  pushSettingsUpdate((prev) => ({ ...prev, ...patch }));
                  setPreviewRefreshCount((c) => c + 1);
                }}
                onUpdateSalonName={(name) => {
                  setSalonName(name);
                  setPreviewRefreshCount((c) => c + 1);
                }}
              />
            </div>
          </div>
        </div>

        {/* =================================================================
           RIGHT PANE (4 Cols on lg): CONTEXT-AWARE SHOPIFY PROPERTY INSPECTOR
           ================================================================= */}
        <div className="lg:col-span-4 bg-white flex flex-col h-[560px] lg:h-[820px] overflow-hidden">
          {/* Inspector Header */}
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Shopify Property Inspector · लाइव एडिटर
              </div>
              <h4 className="text-sm font-bold text-neutral-900">
                {selectedTarget in SECTION_META
                  ? `${SECTION_META[selectedTarget as EditableWebsiteSectionId].title} (${
                      SECTION_META[selectedTarget as EditableWebsiteSectionId].hindi
                    })`
                  : selectedTarget === 'themes'
                  ? '6 Royal & Luxe Salon Themes (6 थीम)'
                  : selectedTarget === 'colors'
                  ? 'Custom Color Palette (10 कलर)'
                  : selectedTarget === 'typography'
                  ? 'Typography & Fonts (फॉन्ट स्टाइल)'
                  : 'Layout & Card Architecture'}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllChanges()}
              disabled={saving}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              <span>Apply</span>
            </button>
          </div>

          {/* Scrollable Inspector Controls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* ===============================================================
               INSPECTOR 1: 6 ROYAL & LUXE THEMES (WITH NEW 6th ROSÉ LUXE PINK)
               =============================================================== */}
            {selectedTarget === 'themes' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-950">
                  <div className="font-bold">All 6 Premium Salon Themes (अब कुल 6 थीम उपलब्ध हैं)</div>
                  <p className="text-[11px] text-pink-800 mt-0.5">
                    हमने आपकी पहले वाली 5 रॉयल थीम्स के साथ नई <strong>6th Theme: Rosé Luxe Pink</strong> भी जोड़ दी है। किसी भी थीम पर क्लिक करके तुरंत लाइव देखें!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {ALLOWED_ROYAL_THEMES.map((tId, index) => {
                    const t = ROYAL_THEMES[tId];
                    const isSelected = activeThemeId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          pushSettingsUpdate((prev) => ({
                            ...prev,
                            themeId: t.id,
                            layoutVariant: t.layoutVariant,
                          }));
                        }}
                        className={`rounded-xl border overflow-hidden cursor-pointer transition-all flex items-center gap-3 p-2.5 ${
                          isSelected
                            ? 'border-pink-600 ring-2 ring-pink-600/15 bg-pink-50/30'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="w-24 aspect-[16/10] rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative">
                          <img src={t.previewSvgDataUri} alt={t.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 left-1 flex gap-1 bg-black/60 px-1.5 py-0.5 rounded">
                            {t.swatches.map((hex, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-full border border-white/50"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                              Theme #{index + 1}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="font-serif font-bold text-sm text-neutral-900 truncate">{t.name}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{t.tagline}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 2: ANNOUNCEMENT BAR
               =============================================================== */}
            {selectedTarget === 'announcement' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show Announcement Bar</div>
                    <div className="text-[11px] text-neutral-500">वेबसाइट के सबसे ऊपर ऑफर पट्टी दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showNoticeBanner !== false}
                    onChange={(e) => updateField('showNoticeBanner', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Promotional / Offer Text (ऑफर टेक्स्ट)
                  </label>
                  <input
                    type="text"
                    value={settings.noticeBanner || ''}
                    onChange={(e) => updateField('noticeBanner', e.target.value)}
                    placeholder="e.g. Flat 20% Off on Bridal Makeup Bookings this month!"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-bold text-neutral-500 mb-1.5">
                    1-Click Offer Templates:
                  </div>
                  <div className="space-y-1.5">
                    {[
                      '✨ Royal Bridal Season: Book Your Trial Consultation & Get 20% Off!',
                      '💖 Rosé Luxe Special: Complimentary Hair Spa with Every Facial Package!',
                      '🌿 Festive Glow Offer: Special Haldi, Mehndi & Bridal Shringar Packages Available!',
                    ].map((presetText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          updateField('noticeBanner', presetText);
                          updateField('showNoticeBanner', true);
                        }}
                        className="w-full text-left p-2 rounded-lg border border-neutral-200 hover:border-blue-400 bg-neutral-50 text-[11px] text-neutral-700"
                      >
                        {presetText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 3: HEADER, BRAND LOGO & NAVIGATION
               =============================================================== */}
            {selectedTarget === 'header' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Salon / Parlour Name (सैलून का नाम)
                  </label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-semibold"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">Brand Logo / Crest Photo</span>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showLogo !== false}
                        onChange={(e) => updateField('showLogo', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Show Custom Logo</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            (uri) => {
                              updateField('logoUrl', uri);
                              updateField('showLogo', true);
                            },
                            400
                          )
                        }
                      />
                    </label>

                    <label className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Phone Camera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            (uri) => {
                              updateField('logoUrl', uri);
                              updateField('showLogo', true);
                            },
                            400
                          )
                        }
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={(e) => {
                      updateField('logoUrl', e.target.value);
                      updateField('showLogo', true);
                    }}
                    placeholder="Or paste Logo URL..."
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Header Button Text</label>
                    <input
                      type="text"
                      value={settings.headerCtaText || ''}
                      onChange={(e) => updateField('headerCtaText', e.target.value)}
                      placeholder="Book Now"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={settings.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-neutral-600 mb-1">Services Link</label>
                    <input
                      type="text"
                      value={settings.navServicesLabel || ''}
                      onChange={(e) => updateField('navServicesLabel', e.target.value)}
                      placeholder="Services"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 mb-1">Gallery Link</label>
                    <input
                      type="text"
                      value={settings.navGalleryLabel || ''}
                      onChange={(e) => updateField('navGalleryLabel', e.target.value)}
                      placeholder="Gallery"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 mb-1">Contact Link</label>
                    <input
                      type="text"
                      value={settings.navHoursLabel || ''}
                      onChange={(e) => updateField('navHoursLabel', e.target.value)}
                      placeholder="Contact"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 4: HERO BANNER, HEADLINE & MAIN PHOTO
               =============================================================== */}
            {selectedTarget === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Top Tagline / Kicker (छोटी टैगलाइन)
                  </label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="BECAUSE YOU DESERVE TO SHINE"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Main Hero Headline (बड़ी मुख्य हेडलाइन)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.heroHeadline || ''}
                    onChange={(e) => updateField('heroHeadline', e.target.value)}
                    placeholder="Premium Salon Experience For Modern Women"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-serif font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Hero Subheadline / Description (विवरण)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.heroSubheadline || ''}
                    onChange={(e) => updateField('heroSubheadline', e.target.value)}
                    placeholder="Indulge in luxury treatments crafted by expert stylists..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Primary Button</label>
                    <input
                      type="text"
                      value={settings.heroPrimaryBtnText || ''}
                      onChange={(e) => updateField('heroPrimaryBtnText', e.target.value)}
                      placeholder="Book Appointment"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Secondary Button</label>
                    <input
                      type="text"
                      value={settings.heroSecondaryBtnText || ''}
                      onChange={(e) => updateField('heroSecondaryBtnText', e.target.value)}
                      placeholder="Explore Services"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Hero Photo Upload + Indian Photo Library Picker */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="font-bold text-neutral-900">
                    Hero Background / Banner Photo (मेन हीरो फोटो)
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Mobile / PC Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (uri) => updateField('heroImageUrl', uri), 1280)}
                      />
                    </label>

                    <label className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Mobile Camera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (uri) => updateField('heroImageUrl', uri), 1280)}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateField('heroImageUrl', getRoseLuxeSalonHeroUri())}
                    className="w-full py-2 px-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use Signature Rosé Luxe Dark Salon Interior Backdrop</span>
                  </button>

                  {renderIndianPhotoQuickPicker((url) => updateField('heroImageUrl', url))}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 5: TRUST STATS STRIP
               =============================================================== */}
            {selectedTarget === 'stats' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show Trust Stats Strip</div>
                    <div className="text-[11px] text-neutral-500">हीरो में 4.9 Rating और 5000+ Clients दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showStatsStrip !== false}
                    onChange={(e) => updateField('showStatsStrip', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Stat 1 Value</label>
                    <input
                      type="text"
                      value={settings.stat1Value || ''}
                      onChange={(e) => updateField('stat1Value', e.target.value)}
                      placeholder="4.9"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Stat 1 Label</label>
                    <input
                      type="text"
                      value={settings.stat1Label || ''}
                      onChange={(e) => updateField('stat1Label', e.target.value)}
                      placeholder="Rating"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Stat 2 Value</label>
                    <input
                      type="text"
                      value={settings.stat2Value || ''}
                      onChange={(e) => updateField('stat2Value', e.target.value)}
                      placeholder="5000+"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Stat 2 Label</label>
                    <input
                      type="text"
                      value={settings.stat2Label || ''}
                      onChange={(e) => updateField('stat2Label', e.target.value)}
                      placeholder="Happy Clients"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">City / Stat 3</label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Ahmedabad"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Stat 3 Label</label>
                    <input
                      type="text"
                      value={settings.stat3Label || ''}
                      onChange={(e) => updateField('stat3Label', e.target.value)}
                      placeholder="Location"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 6: SERVICES & PRICING SECTION
               =============================================================== */}
            {selectedTarget === 'services' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Section Kicker (ऊपर का छोटा टेक्स्ट)</label>
                  <input
                    type="text"
                    value={settings.servicesKicker || ''}
                    onChange={(e) => updateField('servicesKicker', e.target.value)}
                    placeholder="WHAT WE OFFER"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Section Heading (सर्विसेज हेडिंग)</label>
                  <input
                    type="text"
                    value={settings.servicesHeading || ''}
                    onChange={(e) => updateField('servicesHeading', e.target.value)}
                    placeholder="Our Premium Services"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-serif font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={settings.servicesSubheading || ''}
                    onChange={(e) => updateField('servicesSubheading', e.target.value)}
                    placeholder="Luxury treatments tailored for you, delivered by skilled professionals"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Book Button Label</label>
                    <input
                      type="text"
                      value={settings.serviceBookBtnText || ''}
                      onChange={(e) => updateField('serviceBookBtnText', e.target.value)}
                      placeholder="Book Now"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Currency (मुद्रा चिन्ह)</label>
                    <select
                      value={settings.currency || '₹'}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-bold"
                    >
                      <option value="₹">₹ (Indian Rupee)</option>
                      <option value="$">$ (US Dollar)</option>
                      <option value="€">€ (Euro)</option>
                      <option value="£">£ (British Pound)</option>
                      <option value="AED ">AED (Dirham)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Service Card Layout Style</label>
                  <select
                    value={settings.serviceCardStyle || 'photo-card'}
                    onChange={(e) => updateField('serviceCardStyle', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    <option value="photo-card">Photo-Top Luxury Cards (Rosé Luxe Pink Style)</option>
                    <option value="bordered">Minimal Bordered Cards</option>
                    <option value="framed">Royal Gold Framed Cards</option>
                    <option value="editorial-row">Editorial Menu Rows</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-200">
                  <div className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    Service Card Photos & Images (सर्विस कार्ड फोटो)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    प्रत्येक सर्विस कार्ड की फोटो बदलें या मोबाइल कैमरा/पीसी से अपलोड करें।
                  </div>

                  <div className="space-y-2.5">
                    {services.map((svc, sIdx) => {
                      const currentPhoto =
                        settings.servicePhotos?.[svc.id] ||
                        INDIAN_SALON_PHOTO_LIBRARY[sIdx % INDIAN_SALON_PHOTO_LIBRARY.length].imageUrl;

                      return (
                        <div key={svc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={currentPhoto} alt={svc.name} className="w-12 h-10 rounded-lg object-cover shrink-0 border" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-neutral-900 truncate">{svc.name}</div>
                              <div className="text-[10px] text-neutral-500">{svc.category} · {settings.currency || '₹'}{svc.price}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <label className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold cursor-pointer flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              <span>Change</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const updated = {
                                      ...(settings.servicePhotos || {}),
                                      [svc.id]: String(reader.result),
                                    };
                                    updateField('servicePhotos', updated);
                                    setPreviewRefreshCount((c) => c + 1);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                    <div>
                      <div className="font-bold text-neutral-900">Show "All Services" Filter Tab</div>
                      <div className="text-[11px] text-neutral-500">सभी सर्विसेज देखने के लिए 'All' बटन दिखाएं या छुपाएं</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showAllCategoryTab !== false}
                      onChange={(e) => updateField('showAllCategoryTab', e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 7: WHY CHOOSE US (4 PILLARS)
               =============================================================== */}
            {selectedTarget === 'why-choose-us' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show "Why Choose Us" Section</div>
                    <div className="text-[11px] text-neutral-500">4 फीचर कार्ड्स (Premium Quality, Hygiene आदि) दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSectionVisible('why-choose-us')}
                    onChange={() => toggleSectionVisibility('why-choose-us')}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Kicker Label</label>
                  <input
                    type="text"
                    value={settings.whyChooseUsKicker || ''}
                    onChange={(e) => updateField('whyChooseUsKicker', e.target.value)}
                    placeholder="WHY US"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Heading</label>
                  <input
                    type="text"
                    value={settings.whyChooseUsHeading || ''}
                    onChange={(e) => updateField('whyChooseUsHeading', e.target.value)}
                    placeholder="Why Choose Us"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-serif font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={settings.whyChooseUsSubheading || ''}
                    onChange={(e) => updateField('whyChooseUsSubheading', e.target.value)}
                    placeholder="Experience the difference that sets us apart from the rest"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 8: ABOUT SALON & STORY
               =============================================================== */}
            {selectedTarget === 'about' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show About Us Section</div>
                    <div className="text-[11px] text-neutral-500">हमारे सैलून की कहानी और फोटो कोलाज दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showAboutSection !== false}
                    onChange={(e) => updateField('showAboutSection', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">About Kicker</label>
                  <input
                    type="text"
                    value={settings.aboutKicker || ''}
                    onChange={(e) => updateField('aboutKicker', e.target.value)}
                    placeholder="ABOUT US"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">About Title (हेडिंग)</label>
                  <input
                    type="text"
                    value={settings.aboutTitle || ''}
                    onChange={(e) => updateField('aboutTitle', e.target.value)}
                    placeholder="Crafting Beauty Since 2014"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-serif font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Salon Story / Description</label>
                  <textarea
                    rows={3}
                    value={settings.aboutDescription || ''}
                    onChange={(e) => updateField('aboutDescription', e.target.value)}
                    placeholder="At our salon, we believe every woman deserves to feel beautiful and confident..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                {/* About Photo Upload + Indian Library */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="font-bold text-neutral-900">About Section Featured Photo</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (uri) => updateField('aboutImageUrl', uri), 1100)}
                      />
                    </label>
                    <label className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Phone Camera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (uri) => updateField('aboutImageUrl', uri), 1100)}
                      />
                    </label>
                  </div>

                  {renderIndianPhotoQuickPicker((url) => updateField('aboutImageUrl', url))}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 9: INDIAN LOOK PHOTO GALLERY & MOBILE UPLOAD
               =============================================================== */}
            {selectedTarget === 'gallery' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show Photo Gallery Section</div>
                    <div className="text-[11px] text-neutral-500">वेबसाइट पर फोटो गैलरी दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showGallerySection !== false}
                    onChange={(e) => updateField('showGallerySection', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Gallery Kicker</label>
                    <input
                      type="text"
                      value={settings.galleryKicker || ''}
                      onChange={(e) => updateField('galleryKicker', e.target.value)}
                      placeholder="OUR WORK"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Gallery Heading</label>
                    <input
                      type="text"
                      value={settings.galleryHeading || ''}
                      onChange={(e) => updateField('galleryHeading', e.target.value)}
                      placeholder="Gallery"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-serif font-bold"
                    />
                  </div>
                </div>

                {/* Instant Mobile Upload Box */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2.5">
                  <div className="font-bold text-neutral-900">
                    Instant Mobile Photo Upload (मोबाइल से सीधे गैलरी में फोटो डालें)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phone Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={galleryBusy}
                        onChange={handleDirectMobileGalleryUpload}
                      />
                    </label>

                    <label className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Live Camera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        disabled={galleryBusy}
                        onChange={handleDirectMobileGalleryUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Pre-Uploaded Indian Salon Photo Library (1-Click Add to Gallery) */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pre-Uploaded Indian Look Photos (1-Click Add)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {INDIAN_SALON_PHOTO_LIBRARY.map((preset) => (
                      <div
                        key={preset.id}
                        className="rounded-lg border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between"
                      >
                        <div className="aspect-[16/10] bg-neutral-900 overflow-hidden">
                          <img src={preset.imageUrl} alt={preset.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-amber-800 truncate">{preset.hindiTitle}</div>
                          <div className="text-[11px] font-semibold text-neutral-900 truncate">{preset.title}</div>
                          <button
                            type="button"
                            disabled={galleryBusy}
                            onClick={() => handleQuickAddPresetToGallery(preset)}
                            className="mt-1.5 w-full py-1 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add to Gallery</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Existing Gallery Items List */}
                <div className="space-y-2">
                  <div className="font-bold text-neutral-800">
                    Current Gallery Photos ({gallery.length})
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {gallery.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg border border-neutral-200 bg-neutral-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={g.image_url}
                            alt={g.title}
                            className="w-11 h-9 rounded object-cover border border-neutral-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-900 truncate">{g.title}</div>
                            <div className="text-[10px] text-neutral-500">{g.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGalleryItem(g);
                              setNewGalleryTitle(g.title);
                              setNewGalleryCategory(g.category);
                              setNewGalleryUrl(g.image_url);
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-900"
                            title="Edit Photo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryPhoto(g.id)}
                            className="p-1 text-rose-600 hover:text-rose-800"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Add/Edit Form */}
                <form onSubmit={handleAddOrUpdateGalleryPhoto} className="p-3 rounded-xl border border-neutral-200 space-y-2.5">
                  <div className="font-bold text-neutral-900">
                    {editingGalleryItem ? `Editing: ${editingGalleryItem.title}` : 'Add Custom Gallery Photo'}
                  </div>
                  <input
                    type="text"
                    placeholder="Photo Title (e.g. Royal Bridal Makeup)"
                    value={newGalleryTitle}
                    onChange={(e) => setNewGalleryTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g. Bridal & Styling)"
                    value={newGalleryCategory}
                    onChange={(e) => setNewGalleryCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Paste Image URL or Upload..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={galleryBusy}
                      className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold"
                    >
                      {editingGalleryItem ? 'Update Photo' : 'Add Photo'}
                    </button>
                    {editingGalleryItem && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGalleryItem(null);
                          setNewGalleryTitle('');
                          setNewGalleryUrl('');
                        }}
                        className="px-3 py-2 bg-neutral-100 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 10: CLIENT TESTIMONIALS & REVIEWS
               =============================================================== */}
            {selectedTarget === 'reviews' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show Client Reviews</div>
                    <div className="text-[11px] text-neutral-500">ग्राहकों के रिव्यु सेक्शन को दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showReviewsSection !== false}
                    onChange={(e) => updateField('showReviewsSection', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Reviews Kicker</label>
                    <input
                      type="text"
                      value={settings.reviewsKicker || ''}
                      onChange={(e) => updateField('reviewsKicker', e.target.value)}
                      placeholder="CLIENT LOVE"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Reviews Heading</label>
                    <input
                      type="text"
                      value={settings.reviewsHeading || ''}
                      onChange={(e) => updateField('reviewsHeading', e.target.value)}
                      placeholder="Client Testimonials"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <form onSubmit={handleAddReview} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <div className="font-bold text-neutral-900">Add New Client Review</div>
                  <input
                    type="text"
                    placeholder="Client Name (e.g. Priya Sharma)"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    >
                      <option value={5}>★★★★★ (5.0)</option>
                      <option value={4}>★★★★☆ (4.0)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Service Tag (e.g. Bridal Makeup)"
                      value={newReviewTag}
                      onChange={(e) => setNewReviewTag(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Review comment..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={reviewsBusy}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold"
                  >
                    Add Review
                  </button>
                </form>

                <div className="space-y-2">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg border border-neutral-200 flex justify-between gap-2">
                      <div>
                        <div className="font-bold text-neutral-900">
                          {r.author_name} ({r.rating}★)
                        </div>
                        <p className="text-[11px] text-neutral-600 line-clamp-2">"{r.comment}"</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(r.id)}
                        className="text-rose-600 hover:text-rose-800 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 11: OPENING HOURS & LOCATION
               =============================================================== */}
            {selectedTarget === 'hours' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-neutral-900">Show Hours & Location Section</div>
                    <div className="text-[11px] text-neutral-500">खुलने का समय और पता दिखाएं</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showHoursSection !== false}
                    onChange={(e) => updateField('showHoursSection', e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Street Address (पता)</label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">City (शहर)</label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <div className="font-bold text-neutral-900">Weekly Schedule (साप्ताहिक समय)</div>
                  {(settings.openingHours || DEFAULT_DAYS).map((h, i) => (
                    <div key={h.day} className="flex items-center justify-between gap-2 py-1">
                      <label className="flex items-center gap-1.5 font-medium text-neutral-800 w-24">
                        <input
                          type="checkbox"
                          checked={h.isOpen}
                          onChange={(e) => handleUpdateOpeningHour(i, { isOpen: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span>{h.day.slice(0, 3)}</span>
                      </label>
                      {h.isOpen ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={h.openTime}
                            onChange={(e) => handleUpdateOpeningHour(i, { openTime: e.target.value })}
                            className="px-1.5 py-1 border border-neutral-300 rounded text-[11px]"
                          />
                          <span>–</span>
                          <input
                            type="time"
                            value={h.closeTime}
                            onChange={(e) => handleUpdateOpeningHour(i, { closeTime: e.target.value })}
                            className="px-1.5 py-1 border border-neutral-300 rounded text-[11px]"
                          />
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 12: FOOTER & SOCIAL LINKS
               =============================================================== */}
            {selectedTarget === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Footer Edition Tagline</label>
                  <input
                    type="text"
                    value={settings.footerTagline || ''}
                    onChange={(e) => updateField('footerTagline', e.target.value)}
                    placeholder="Rosé Luxe Pink Edition"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Instagram Profile Link</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      updateField('socialLinks', {
                        ...(settings.socialLinks || {}),
                        instagram: e.target.value,
                      })
                    }
                    placeholder="https://instagram.com/yoursalon"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Facebook Page Link</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      updateField('socialLinks', {
                        ...(settings.socialLinks || {}),
                        facebook: e.target.value,
                      })
                    }
                    placeholder="https://facebook.com/yoursalon"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 13: GLOBAL COLOR PALETTE (10 TOKENS)
               =============================================================== */}
            {selectedTarget === 'colors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">10-Token Theme Color Palette</span>
                  <button
                    type="button"
                    onClick={handleResetCustomColors}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[11px] font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Colors</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(
                    [
                      { key: 'buttonBg', label: 'Primary Button & Pink Accent (बटन कलर)' },
                      { key: 'buttonText', label: 'Button Text Color (बटन अक्षर कलर)' },
                      { key: 'canvasBg', label: 'Page Background (पेज बैकग्राउंड)' },
                      { key: 'surfaceBg', label: 'Card & Section Surface (कार्ड बैकग्राउंड)' },
                      { key: 'heroBg', label: 'Hero Banner Background (हीरो बैकग्राउंड)' },
                      { key: 'heroText', label: 'Hero Headline Text (हीरो टेक्स्ट)' },
                      { key: 'textPrimary', label: 'Main Heading & Body Text (मुख्य अक्षर)' },
                      { key: 'accentPrimary', label: 'Primary Brand Accent' },
                      { key: 'accentSecondary', label: 'Gold / Secondary Border Accent' },
                      { key: 'footerBg', label: 'Footer Background (फुटर बैकग्राउंड)' },
                    ] as Array<{ key: keyof CustomThemeColors; label: string }>
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-800">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={effectiveColors[item.key]}
                          onChange={(e) => updateCustomColor(item.key, e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border border-neutral-300"
                        />
                        <input
                          type="text"
                          value={effectiveColors[item.key]}
                          onChange={(e) => updateCustomColor(item.key, e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-neutral-300 rounded font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 14: TYPOGRAPHY & FONTS
               =============================================================== */}
            {selectedTarget === 'typography' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Heading Font Family (हेडिंग फॉन्ट)
                  </label>
                  <select
                    value={settings.headingFont || activeThemeTokens.typography.headingFont}
                    onChange={(e) => updateField('headingFont', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    {HEADING_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Body Font Family (बॉडी फॉन्ट)
                  </label>
                  <select
                    value={settings.bodyFont || BODY_FONT_OPTIONS[0].value}
                    onChange={(e) => updateField('bodyFont', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    {BODY_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Letter Spacing Style (अक्षरों के बीच की दूरी)
                  </label>
                  <select
                    value={settings.letterSpacingStyle || 'normal'}
                    onChange={(e) => updateField('letterSpacingStyle', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    <option value="normal">Normal Tight Luxury</option>
                    <option value="wide">Wide Editorial Tracking</option>
                    <option value="editorial">Haute Couture Spaced</option>
                  </select>
                </div>
              </div>
            )}

            {/* ===============================================================
               INSPECTOR 15: LAYOUT & CARD ARCHITECTURE
               =============================================================== */}
            {selectedTarget === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Hero Showcase Architecture (हीरो डिज़ाइन)
                  </label>
                  <select
                    value={settings.layoutVariant || activeThemeTokens.layoutVariant}
                    onChange={(e) => updateField('layoutVariant', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    <option value="rose-luxe-pink">
                      Rosé Luxe Pink (Frosted Dark Glass + Sweeping Wave)
                    </option>
                    <option value="editorial-noir">Editorial Noir (Split Frame)</option>
                    <option value="parisian-split">Parisian Split (50/50 Portrait)</option>
                    <option value="regal-arch">Regal Bridal Arch</option>
                    <option value="botanical-grid">Botanical Spa Sanctuary</option>
                    <option value="architectural-minimal">Architectural Minimal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Service Card Style (सर्विस कार्ड डिज़ाइन)
                  </label>
                  <select
                    value={settings.serviceCardStyle || activeThemeTokens.typography.serviceCardStyle}
                    onChange={(e) => updateField('serviceCardStyle', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  >
                    <option value="photo-card">Photo-Top Cards (Rosé Luxe Pink)</option>
                    <option value="bordered">Minimal Bordered Cards</option>
                    <option value="framed">Gold Framed Luxury Cards</option>
                    <option value="editorial-row">Editorial Menu Rows</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scissors,
  Image as ImageIcon,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Check,
  Eye,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
  Sparkles,
  Palette,
  Upload,
  Camera,
  Smartphone,
  CloudCheck,
  QrCode,
  Download,
  Printer,
  Copy,
} from 'lucide-react';
import { saasApi } from '../services/api.ts';
import { Tenant, Booking, Service, GalleryItem, RoyalThemeId } from '../types/saas.ts';
import { SAAS_PLANS } from '../config/plans.ts';
import { ROYAL_THEMES, resolveSafeThemeId } from '../config/themes.ts';
import { INDIAN_SALON_PHOTO_LIBRARY, IndianSalonPhotoPreset } from '../config/indianPhotoLibrary.ts';
import { ThemeStore } from './ThemeStore.tsx';
import { ThemeCustomizerStudio } from './ThemeCustomizerStudio.tsx';
import { auth, onAuthStateChanged, signInWithGooglePopup, FirebaseUser } from '../firebase.ts';
import { firebaseCloudSync } from '../services/firebaseSync.ts';

interface OwnerDashboardProps {
  tenantId: string;
  onViewPublicSite: (slug: string) => void;
  onLogout: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  tenantId,
  onViewPublicSite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'gallery' | 'themes' | 'customizer' | 'subscription' | 'qr-app'>('overview');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ownerDeferredPrompt, setOwnerDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setOwnerDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installAppType, setInstallAppType] = useState<'owner' | 'customer'>('owner');

  const handleInstallOwnerApp = async () => {
    if (ownerDeferredPrompt) {
      ownerDeferredPrompt.prompt();
      const choice = await ownerDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setOwnerDeferredPrompt(null);
      }
    } else {
      setInstallAppType('owner');
      setShowInstallModal(true);
    }
  };

  const handleInstallCustomerApp = () => {
    setInstallAppType('customer');
    setShowInstallModal(true);
  };

  const handleDownloadQrSvg = () => {
    const svgEl = document.getElementById('tenant-qr-svg');
    if (!svgEl) {
      alert('QR Code element not found.');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.slug}-customer-app-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage('QR Code downloaded as SVG successfully!');
  };

  const handleDownloadQrPng = () => {
    const svgEl = document.getElementById('tenant-qr-svg');
    if (!svgEl) {
      alert('QR Code element not found.');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${tenant.slug}-customer-app-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSuccessMessage('QR Code downloaded as High-Res PNG successfully!');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  };

  // Filters for bookings tab
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  // Service Modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Hair & Styling');
  const [servicePrice, setServicePrice] = useState('65');
  const [serviceDuration, setServiceDuration] = useState('60');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceIsPopular, setServiceIsPopular] = useState(false);

  // Gallery Modal state
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCat, setGalleryCat] = useState('Portfolio');
  const [galleryUrl, setGalleryUrl] = useState('');

  // Customizer state
  const [customizerSettings, setCustomizerSettings] = useState<any>({});
  const [salonName, setSalonName] = useState('');
  const [customizerSubTab, setCustomizerSubTab] = useState<'themes' | 'photos' | 'typography' | 'layout' | 'hours' | 'reviews'>('themes');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [cloudSyncing, setCloudSyncing] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [tenantId]);

  const handleFirebaseCloudSync = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCloudSyncing(true);
    try {
      let activeFbUser = auth.currentUser;
      if (!activeFbUser) {
        activeFbUser = await signInWithGooglePopup();
        setFirebaseUser(activeFbUser);
      }
      if (dashboardData?.tenant) {
        const res = await firebaseCloudSync.syncTenantToFirestore(
          dashboardData.tenant,
          services,
          gallery,
          bookings
        );
        setSuccessMessage(
          `Synced to Google Firebase Cloud (${res.servicesCount} services, ${res.galleryCount} photos, ${res.bookingsCount} bookings backed up)!`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync with Firebase Cloud Firestore');
    } finally {
      setCloudSyncing(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [dash, bList, sList, gList] = await Promise.all([
        saasApi.getOwnerDashboard(tenantId),
        saasApi.getOwnerBookings(tenantId),
        saasApi.getOwnerServices(tenantId),
        saasApi.getOwnerGallery(tenantId),
      ]);
      setDashboardData(dash);
      setBookings(bList);
      setServices(sList);
      setGallery(gList);
      setCustomizerSettings(dash.tenant.settings || {});
      setSalonName(dash.tenant.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load salon dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await saasApi.updateBookingStatus(tenantId, bookingId, newStatus);
      setSuccessMessage(res.message);
      // Reload bookings and dashboard
      const [bList, dash] = await Promise.all([
        saasApi.getOwnerBookings(tenantId, { status: bookingStatusFilter !== 'all' ? bookingStatusFilter : undefined, search: bookingSearch }),
        saasApi.getOwnerDashboard(tenantId),
      ]);
      setBookings(bList);
      setDashboardData(dash);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      if (editingService) {
        await saasApi.updateService(tenantId, editingService.id, {
          name: serviceName,
          category: serviceCategory,
          price: Number(servicePrice),
          duration_minutes: Number(serviceDuration),
          description: serviceDesc,
          is_popular: serviceIsPopular,
        });
        setSuccessMessage('Service updated successfully.');
      } else {
        await saasApi.createService(tenantId, {
          name: serviceName,
          category: serviceCategory,
          price: Number(servicePrice),
          duration_minutes: Number(serviceDuration),
          description: serviceDesc,
          is_popular: serviceIsPopular,
        });
        setSuccessMessage('New service added to salon catalog.');
      }
      setIsServiceModalOpen(false);
      const sList = await saasApi.getOwnerServices(tenantId);
      setServices(sList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await saasApi.deleteService(tenantId, serviceId);
      setServices(services.filter((s) => s.id !== serviceId));
      setSuccessMessage('Service removed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete service.');
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await saasApi.createGalleryItem(tenantId, {
        title: galleryTitle,
        category: galleryCat,
        image_url: galleryUrl,
      });
      setIsGalleryModalOpen(false);
      setGalleryTitle('');
      setGalleryUrl('');
      const gList = await saasApi.getOwnerGallery(tenantId);
      setGallery(gList);
      setSuccessMessage('Photo added to gallery.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add gallery photo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGallery = async (galleryId: string) => {
    try {
      await saasApi.deleteGalleryItem(tenantId, galleryId);
      setGallery(gallery.filter((g) => g.id !== galleryId));
      setSuccessMessage('Photo removed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete photo.');
    }
  };

  const handleMobileFileToDataUri = (file: File, maxWidth = 1100): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => resolve(String(reader.result));
        img.onload = () => {
          try {
            let w = img.width;
            let h = img.height;
            if (w > maxWidth) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(String(reader.result));
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.84));
          } catch {
            resolve(String(reader.result));
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDirectMobileGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const dataUri = await handleMobileFileToDataUri(file, 1100);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Indian Salon Look';
      await saasApi.createGalleryItem(tenantId, {
        title: cleanName,
        category: 'Bridal & Styling',
        image_url: dataUri,
      });
      const gList = await saasApi.getOwnerGallery(tenantId);
      setGallery(gList);
      setSuccessMessage(`Photo '${cleanName}' uploaded from your device to Website Gallery!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo from device.');
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  const handleUseIndianPresetInGallery = async (preset: IndianSalonPhotoPreset) => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await saasApi.createGalleryItem(tenantId, {
        title: preset.title,
        category: preset.category,
        image_url: preset.imageUrl,
      });
      const gList = await saasApi.getOwnerGallery(tenantId);
      setGallery(gList);
      setSuccessMessage(`Added '${preset.title}' (${preset.hindiTitle}) to your live Website Gallery!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add photo to gallery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUseIndianPresetAsHero = async (preset: IndianSalonPhotoPreset) => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = {
        ...customizerSettings,
        heroImageUrl: preset.imageUrl,
      };
      const res = await saasApi.updateOwnerSettings(tenantId, updated, salonName);
      const savedSettings = res.settings || updated;
      setCustomizerSettings(savedSettings);
      setDashboardData({
        ...dashboardData,
        tenant: {
          ...dashboardData.tenant,
          settings: savedSettings,
        },
      });
      setSuccessMessage(`Set '${preset.title}' (${preset.hindiTitle}) as your live Website Hero Banner!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update hero photo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCustomizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await saasApi.updateOwnerSettings(tenantId, customizerSettings, salonName);
      setSuccessMessage('Website branding and settings successfully published!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-neutral-600">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
        <h3 className="text-base font-medium text-neutral-800">Authenticating & Loading Salon Dashboard</h3>
        <p className="text-xs text-neutral-500 font-mono">Scoped Tenant ID: {tenantId}</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { tenant, todayBookings, stats } = dashboardData;
  const currentPlan = SAAS_PLANS[tenant.plan_id] || SAAS_PLANS.starter;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-8 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold font-serif text-sm">
              {tenant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">{tenant.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    tenant.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {tenant.status}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {currentPlan.name}
                </span>
              </div>
              <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
                <span className="font-mono">Subdomain: {tenant.slug}.glamhub.com</span>
                <span>·</span>
                <span>
                  Theme: <strong className="text-neutral-800">{ROYAL_THEMES[resolveSafeThemeId(tenant.settings?.themeId)].name}</strong>
                </span>
                <span>·</span>
                <button
                  onClick={() => onViewPublicSite(tenant.slug)}
                  className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <span>View Public Website</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInstallOwnerApp}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Install Business Owner Dashboard App"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Install Owner App</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const activeTheme = resolveSafeThemeId(tenant.settings?.themeId);
                const shareUrl = `${window.location.origin}${window.location.pathname}?tenant=${encodeURIComponent(tenant.slug)}&theme=${encodeURIComponent(activeTheme)}`;
                navigator.clipboard.writeText(shareUrl);
                setSuccessMessage(`Shareable website & theme link copied: ${shareUrl}`);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Shareable Link for Marketing"
            >
              <span>Copy Shareable Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                const activeTheme = resolveSafeThemeId(tenant.settings?.themeId);
                const shareUrl = `${window.location.origin}${window.location.pathname}?tenant=${encodeURIComponent(tenant.slug)}&theme=${encodeURIComponent(activeTheme)}`;
                const text = `✨ *${tenant.name} — Official Salon Website*\n\nहमारी सर्विसेज़ देखने और ऑनलाइन अपॉइंटमेंट बुक करने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n👉 ${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Share Website Link on WhatsApp"
            >
              <span>WhatsApp Share</span>
            </button>

            <button
              onClick={handleFirebaseCloudSync}
              disabled={cloudSyncing}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Backup & Sync Salon Data to Google Firebase Cloud Firestore"
            >
              {cloudSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>
                {firebaseUser ? 'Firebase Cloud Synced' : 'Connect & Sync Firebase Cloud'}
              </span>
            </button>
            <button
              onClick={loadAllData}
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto border-t border-neutral-100 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Overview & Today</span>
            {stats.pendingRequests > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {stats.pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'bookings'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>All Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'services'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Services ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'gallery'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gallery ({gallery.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'themes'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Store (6 Royal & Luxe Themes)</span>
          </button>

          <button
            onClick={() => setActiveTab('customizer')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'customizer'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Shopify-Style Theme Editor (लाइव एडिटर)</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'subscription'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription & Limits</span>
          </button>

          <button
            onClick={() => setActiveTab('qr-app')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'qr-app'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Customer App & QR Code</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Pending Requests Alert Banner */}
            {stats.pendingRequests > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    {stats.pendingRequests}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      {stats.pendingRequests} Pending Appointment Requests Awaiting Confirmation
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Customers submitted online bookings. Verify slots and confirm or reject them.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBookingStatusFilter('pending');
                    setActiveTab('bookings');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Review Pending Requests
                </button>
              </div>
            )}

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                <div className="text-xs text-neutral-500 font-medium">Today's Appointments</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">{stats.todayAppointments}</div>
                <div className="text-[11px] text-neutral-400 mt-1">Scheduled for today</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                <div className="text-xs text-neutral-500 font-medium">Pending Requests</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingRequests}</div>
                <div className="text-[11px] text-neutral-400 mt-1">Requires parlour action</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                <div className="text-xs text-neutral-500 font-medium">Upcoming Confirmed</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.upcomingAppointments}</div>
                <div className="text-[11px] text-neutral-400 mt-1">Future confirmed slots</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                <div className="text-xs text-neutral-500 font-medium">Estimated Booking Revenue</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">
                  {tenant.settings?.currency || '$'}
                  {stats.estimatedRevenue}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Confirmed + Completed</div>
              </div>
            </div>

            {/* Quick Launch Banner for Shopify-Style Theme Editor & 6 Themes */}
            <div className="bg-neutral-900 text-white rounded-2xl p-5 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-pink-600/30 border border-pink-500/40 text-pink-300 text-[10px] font-bold uppercase mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Shopify OS 2.0 Visual Builder + 6 Official Themes</span>
                </div>
                <h3 className="text-base font-serif font-bold text-white">
                  Edit Your Salon Website Like Shopify (Click-to-Edit Sections, Photos & 6 Themes)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Click any section on your live website preview to customize text, Indian look photos, colors, section order, or switch between all 6 themes (including Rosé Luxe Pink).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('customizer')}
                  className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Open Shopify Theme Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('themes')}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Browse 6 Themes
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Today's Salon Schedule</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Appointments scheduled for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {todayBookings.length} {todayBookings.length === 1 ? 'client' : 'clients'}
                </span>
              </div>

              {todayBookings.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <span>No appointments scheduled for today yet.</span>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {todayBookings.map((b: any) => (
                    <div key={b.id} className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-mono font-bold text-neutral-800">
                          {b.appointment_time} - {b.end_time}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                            <span>{b.customer_name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : b.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {b.service_name} • {tenant.settings?.currency || '$'}
                            {b.service_price} ({b.service_duration} mins)
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">Tel: {b.customer_phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: BOOKINGS LIST & FILTERS */}
        {/* ==================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-neutral-500 font-semibold mr-1">Status:</span>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setBookingStatusFilter(st);
                      saasApi.getOwnerBookings(tenantId, { status: st !== 'all' ? st : undefined, search: bookingSearch }).then(setBookings);
                    }}
                    className={`px-3 py-1 rounded-full capitalize font-medium transition-colors ${
                      bookingStatusFilter === st
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search client name or tel..."
                  value={bookingSearch}
                  onChange={(e) => {
                    setBookingSearch(e.target.value);
                    saasApi.getOwnerBookings(tenantId, {
                      status: bookingStatusFilter !== 'all' ? bookingStatusFilter : undefined,
                      search: e.target.value,
                    }).then(setBookings);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Client Details</th>
                      <th className="py-3 px-4">Service & Duration</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-neutral-400">
                          No bookings match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-neutral-700">{b.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900">{b.customer_name}</div>
                            <div className="text-neutral-500 text-[11px]">{b.customer_phone}</div>
                            {b.customer_email && <div className="text-neutral-400 text-[10px]">{b.customer_email}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-900">{b.service_name}</div>
                            <div className="text-neutral-500">
                              {tenant.settings?.currency || '$'}
                              {b.service_price} • {b.service_duration}m
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-neutral-800">{b.appointment_date}</div>
                            <div className="text-neutral-500 font-mono">
                              {b.appointment_time} - {b.end_time}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : b.status === 'completed'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                            {b.customer_notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                    title="Confirm Booking"
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                                    title="Reject Request"
                                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                  className="px-2 py-1 bg-neutral-900 text-white hover:bg-neutral-800 rounded text-[11px] font-semibold"
                                >
                                  Complete
                                </button>
                              )}
                              {['confirmed', 'pending'].includes(b.status) && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  title="Cancel Appointment"
                                  className="p-1 text-neutral-400 hover:text-neutral-700 text-[11px] underline"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: SERVICES CATALOG MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Services Catalog</h3>
                <p className="text-xs text-neutral-500">
                  Manage treatment offerings and pricing. Current usage: {services.length} of{' '}
                  {currentPlan.maxServices} services allowed on your {currentPlan.name} plan.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceName('');
                  setServiceCategory('Hair & Styling');
                  setServicePrice('75');
                  setServiceDuration('60');
                  setServiceDesc('');
                  setServiceIsPopular(false);
                  setIsServiceModalOpen(true);
                }}
                disabled={services.length >= currentPlan.maxServices}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {svc.category}
                      </span>
                      {svc.is_popular ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Signature
                        </span>
                      ) : null}
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900">{svc.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{svc.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {tenant.settings?.currency || '$'}
                        {svc.price}
                      </div>
                      <div className="text-[11px] text-neutral-400">{svc.duration_minutes} minutes</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingService(svc);
                          setServiceName(svc.name);
                          setServiceCategory(svc.category);
                          setServicePrice(String(svc.price));
                          setServiceDuration(String(svc.duration_minutes));
                          setServiceDesc(svc.description);
                          setServiceIsPopular(svc.is_popular);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: GALLERY MANAGEMENT + INDIAN LOOK PHOTO LIBRARY */}
        {/* ==================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            {/* Top Bar with Mobile Upload & Add Photo */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Website Photo Gallery & Mobile Upload ({gallery.length} / {currentPlan.maxGalleryItems} Photos)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Upload photos directly from your mobile phone / camera or choose from the Pre-Uploaded Indian Look Gallery below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload from Mobile Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={gallery.length >= currentPlan.maxGalleryItems || actionLoading}
                    onChange={handleDirectMobileGalleryUpload}
                  />
                </label>

                <label className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Mobile Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={gallery.length >= currentPlan.maxGalleryItems || actionLoading}
                    onChange={handleDirectMobileGalleryUpload}
                  />
                </label>

                <button
                  onClick={() => {
                    setGalleryTitle('');
                    setGalleryCat('Bridal Makeup');
                    setGalleryUrl('');
                    setIsGalleryModalOpen(true);
                  }}
                  disabled={gallery.length >= currentPlan.maxGalleryItems}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Photo / URL</span>
                </button>
              </div>
            </div>

            {/* Active Website Portfolio Gallery */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">
                Currently Published on Your Website ({tenant.slug}.glamhub.com)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] bg-neutral-900 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3.5">
                      <span className="text-[10px] uppercase font-bold text-rose-600">{item.category}</span>
                      <div className="text-xs font-bold text-neutral-900 truncate mt-0.5">{item.title}</div>
                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = { ...customizerSettings, heroImageUrl: item.image_url };
                            await saasApi.updateOwnerSettings(tenantId, updated, salonName);
                            setCustomizerSettings(updated);
                            setSuccessMessage(`Set '${item.title}' as Website Hero Banner!`);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[11px] font-semibold"
                        >
                          Use as Hero
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(item.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Uploaded Indian Look Salon Photo Library */}
            <div className="bg-white rounded-2xl p-6 border border-amber-300/80 shadow-xs space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>PRE-UPLOADED INDIAN LOOK PHOTO GALLERY · रेडीमेड इंडियन ब्यूटी पार्लर फोटो</span>
                </div>
                <h4 className="text-base font-serif font-bold text-neutral-900">
                  Ready-to-Use Indian Bridal, Mehndi, Gajra & Parlour Photo Collection
                </h4>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Select any pre-uploaded Indian look photo below to add it to your website gallery or set it as your main Hero Banner in 1 click.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {INDIAN_SALON_PHOTO_LIBRARY.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50 flex flex-col justify-between hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                        <img
                          src={preset.imageUrl}
                          alt={preset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 text-amber-300 text-[10px] font-bold uppercase">
                          {preset.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-bold text-amber-800">{preset.hindiTitle}</div>
                        <h5 className="text-sm font-serif font-bold text-neutral-900 mt-0.5">{preset.title}</h5>
                        <p className="text-[11px] text-neutral-600 mt-1">{preset.description}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-t border-neutral-200/80 flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        disabled={actionLoading || gallery.length >= currentPlan.maxGalleryItems}
                        onClick={() => handleUseIndianPresetInGallery(preset)}
                        className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Use in Gallery</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleUseIndianPresetAsHero(preset)}
                        className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold"
                      >
                        Set as Hero
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: FULL WEBSITE & THEME CUSTOMIZER STUDIO */}
        {/* ==================================================== */}
        {activeTab === 'customizer' && (
          <ThemeCustomizerStudio
            tenantId={tenantId}
            tenantSlug={tenant.slug}
            initialSalonName={salonName}
            initialSettings={customizerSettings}
            gallery={gallery}
            initialSubTab={customizerSubTab}
            onViewPublicSite={onViewPublicSite}
            onGalleryChanged={async () => {
              const gList = await saasApi.getOwnerGallery(tenantId);
              setGallery(gList);
            }}
            onSaved={(newName, updatedSettings) => {
              setSalonName(newName);
              setCustomizerSettings(updatedSettings);
              setDashboardData({
                ...dashboardData,
                tenant: {
                  ...dashboardData.tenant,
                  name: newName,
                  settings: updatedSettings,
                },
              });
            }}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 5B: ROYAL THEME STORE & APPEARANCE */}
        {/* ==================================================== */}
        {activeTab === 'themes' && (
          <ThemeStore
            tenantId={tenantId}
            tenantSlug={tenant.slug}
            tenantName={tenant.name}
            currentThemeId={tenant.settings?.themeId}
            onViewPublicSite={onViewPublicSite}
            onOpenFullCustomizer={(subTab) => {
              if (subTab) setCustomizerSubTab(subTab);
              setActiveTab('customizer');
            }}
            onThemePublished={(_newThemeId: RoyalThemeId, updatedSettings: any) => {
              setCustomizerSettings(updatedSettings);
              setDashboardData({
                ...dashboardData,
                tenant: {
                  ...dashboardData.tenant,
                  settings: updatedSettings,
                },
              });
            }}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 6: SUBSCRIPTION DETAILS */}
        {/* ==================================================== */}
        {activeTab === 'subscription' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Platform Subscription
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 mt-1">{currentPlan.name}</h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    tenant.subscription_status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {tenant.subscription_status}
                </span>
              </div>

              <p className="text-xs text-neutral-600 mb-6">{currentPlan.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs mb-6">
                <div>
                  <div className="text-neutral-500">Plan Rate:</div>
                  <div className="font-bold text-neutral-900 text-sm mt-0.5">
                    ${currentPlan.price} / {currentPlan.billingPeriod}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500">Active Since:</div>
                  <div className="font-medium text-neutral-800 mt-0.5">
                    {new Date(tenant.subscription_starts_at).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500">Subscription Expiry:</div>
                  <div className="font-bold text-neutral-900 mt-0.5">
                    {new Date(tenant.subscription_expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-500 bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex items-start gap-2">
                <Shield className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-800">Platform Subscription Policy:</strong> Subscriptions are
                  manually renewed and managed by GlamHub Super Administration (no unapproved recurring payment charges).
                  If you need to renew or upgrade your plan limits, contact your account coordinator.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: CUSTOMER APP & QR CODE MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'qr-app' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-neutral-900">
                  Customer App & QR Code Management
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Each salon has its own branded customer app URL and QR code. Print and place this QR code at your reception counter so clients can scan and book instantly.
                </p>
              </div>

              {/* Customer App URL Box */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Customer PWA Landing URL</div>
                  <div className="text-xs font-mono text-neutral-900 mt-0.5 break-all">
                    {window.location.origin}/?tenant={tenant.slug}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?tenant=${tenant.slug}`;
                      navigator.clipboard.writeText(url);
                      alert('Customer app URL copied to clipboard!');
                    }}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInstallCustomerApp}
                    className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                    <span>Install Customer App</span>
                  </button>

                  <a
                    href={`/?tenant=${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open App</span>
                  </a>
                </div>
              </div>

              {/* QR Code Card & Print Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4 border-t border-neutral-200">
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white p-6 rounded-2xl text-center shadow-xl flex flex-col items-center justify-center space-y-4">
                  <div className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                    Scan to Book with {tenant.name}
                  </div>

                  {/* SVG QR Code representation */}
                  <div className="bg-white p-4 rounded-2xl shadow-md inline-block">
                    <svg
                      id="tenant-qr-svg"
                      viewBox="0 0 100 100"
                      className="w-48 h-48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="100" height="100" fill="#ffffff" />
                      <path d="M10,10 h30 v30 h-30 z M16,16 h18 v18 h-18 z M22,22 h6 v6 h-6 z" fill="#000000" />
                      <path d="M60,10 h30 v30 h-30 z M66,16 h18 v18 h-18 z M72,22 h6 v6 h-6 z" fill="#000000" />
                      <path d="M10,60 h30 v30 h-30 z M16,66 h18 v18 h-18 z M22,72 h6 v6 h-6 z" fill="#000000" />
                      <rect x="45" y="10" width="8" height="8" fill="#000000" />
                      <rect x="45" y="25" width="8" height="15" fill="#000000" />
                      <rect x="10" y="45" width="15" height="8" fill="#000000" />
                      <rect x="30" y="45" width="10" height="8" fill="#000000" />
                      <rect x="60" y="45" width="30" height="8" fill="#000000" />
                      <rect x="45" y="60" width="15" height="15" fill="#000000" />
                      <rect x="70" y="60" width="20" height="8" fill="#000000" />
                      <rect x="60" y="80" width="12" height="12" fill="#000000" />
                      <rect x="80" y="75" width="10" height="15" fill="#000000" />
                      <text x="50" y="50" fontSize="8" textAnchor="middle" fill="#111111" fontWeight="bold">
                        {tenant.slug.toUpperCase()}
                      </text>
                    </svg>
                  </div>

                  <div className="text-xs text-neutral-300 font-medium">
                    Powered by LocalBoost AI PWA
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-neutral-900">Reception Counter Card & Export</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Download or print this high-resolution QR counter card. When your salon clients scan it with any smartphone camera, it instantly opens your dedicated customer PWA without requiring an app store download.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>Print Counter Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQrPng}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQrSvg}
                      className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                    <div className="font-bold">PWA Installation Instructions for Owner:</div>
                    <div>You can install this Business Owner Dashboard as an app on your phone/PC by clicking 'Install Owner App' in your browser menu or settings.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h4 className="text-base font-bold text-neutral-900 mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h4>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Master Balayage & Glaze"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category (कस्टम नाम लिखें) *</label>
                  <input
                    type="text"
                    required
                    list="common-categories"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    placeholder="e.g. Bridal Shringar, Hair Spa, etc."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  />
                  <datalist id="common-categories">
                    <option value="Hair & Styling" />
                    <option value="Hair Color" />
                    <option value="Facial & Skin" />
                    <option value="Nail Lounge" />
                    <option value="Bridal & Styling" />
                    <option value="Lash & Brow" />
                    <option value="Spa & Massage" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Price ({tenant.settings?.currency || '$'}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={serviceIsPopular}
                      onChange={(e) => setServiceIsPopular(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Signature Choice</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Describe treatment procedures and botanical products used..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h4 className="text-base font-bold text-neutral-900 mb-4">Add Portfolio Photo</h4>

            <form onSubmit={handleAddGalleryItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haute Bridal Chignon"
                  value={galleryTitle}
                  onChange={(e) => setGalleryTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Bridal, Color, Aesthetics, Nails"
                  value={galleryCat}
                  onChange={(e) => setGalleryCat(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Upload from Mobile / Computer or Paste Image URL *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Phone / PC File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uri = await handleMobileFileToDataUri(file, 1100);
                        setGalleryUrl(uri);
                        if (!galleryTitle) {
                          setGalleryTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                        }
                      }}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uri = await handleMobileFileToDataUri(file, 1100);
                        setGalleryUrl(uri);
                        if (!galleryTitle) {
                          setGalleryTitle('Salon Bridal Look');
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Or paste image URL / Data URI..."
                  value={galleryUrl}
                  onChange={(e) => setGalleryUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add to Portfolio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-neutral-900">
                    {installAppType === 'owner' ? 'Install Business Owner App' : `Install ${tenant.name} Customer App`}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {installAppType === 'owner'
                      ? 'Access your salon dashboard like a native mobile app.'
                      : 'Clients get a dedicated app experience with instant booking.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>📱</span>
                  <span>Android (Chrome / Edge / Brave):</span>
                </div>
                <div>1. Tap the browser menu icon (three dots <strong className="font-mono">⋮</strong> at the top-right).</div>
                <div>2. Select <strong className="font-bold">"Install app"</strong> or <strong className="font-bold">"Add to Home screen"</strong>.</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>🍎</span>
                  <span>iPhone / iPad (Safari):</span>
                </div>
                <div>1. Open the app link in Safari.</div>
                <div>2. Tap the <strong className="font-bold">Share</strong> button (<span className="font-mono">⎋</span> or square with arrow at bottom/top).</div>
                <div>3. Scroll down and tap <strong className="font-bold">"Add to Home Screen"</strong>.</div>
              </div>

              {installAppType === 'customer' && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="font-bold text-neutral-900">Customer App Link to Share:</div>
                  <div className="p-2 rounded bg-white border font-mono text-[11px] text-neutral-800 break-all select-all">
                    {window.location.origin}/?tenant={tenant.slug}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/?tenant=${tenant.slug}`;
                      navigator.clipboard.writeText(link);
                      alert('Customer app link copied to clipboard!');
                    }}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Customer App Link</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

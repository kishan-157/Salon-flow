import React, { useState, useEffect } from 'react';
import { PublicSalonSite } from './components/PublicSalonSite.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { SuperAdminPanel } from './components/SuperAdminPanel.tsx';
import { PlatformLanding } from './components/PlatformLanding.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { saasApi, getStoredToken } from './services/api.ts';
import { signOutFirebase } from './firebase.ts';
import { resolveThemeAlias } from './config/themes.ts';
import { RoyalThemeId } from './types/saas.ts';
import { ArrowLeft, Shield, Store } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'platform' | 'tenant' | 'owner' | 'admin'>('platform');
  const [activeSlug, setActiveSlug] = useState<string>('royal');
  const [marketingThemeId, setMarketingThemeId] = useState<RoyalThemeId | undefined>(undefined);
  const [isMarketingShareMode, setIsMarketingShareMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentTenant, setCurrentTenant] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'superadmin' | 'owner'>('owner');

  useEffect(() => {
    checkInitialContext();
  }, []);

  const checkInitialContext = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant') || urlParams.get('t');
    const themeParam = urlParams.get('theme');
    const path = window.location.pathname;
    const pathSlug = path.startsWith('/t/') ? path.replace('/t/', '').split('/')[0] : null;

    // 1. Check if token exists
    let resolvedUser: any = null;
    let resolvedTenant: any = null;
    const token = getStoredToken();
    if (token) {
      try {
        const res = await saasApi.getCurrentUser();
        resolvedUser = res.user;
        resolvedTenant = res.tenant;
        setCurrentUser(res.user);
        setCurrentTenant(res.tenant);
      } catch {
        saasApi.logout();
        setCurrentUser(null);
        setCurrentTenant(null);
      }
    }

    // 2. If a shareable ?theme=... or ?tenant=... or /t/... link was accessed, open the live website/theme view
    const resolvedTheme = resolveThemeAlias(themeParam);
    if (resolvedTheme) {
      const explicitSlug = tenantParam || pathSlug;
      setMarketingThemeId(resolvedTheme);
      if (explicitSlug && explicitSlug !== '__theme_preview__') {
        setIsMarketingShareMode(false);
        setActiveSlug(explicitSlug.toLowerCase());
      } else {
        setIsMarketingShareMode(true);
        setActiveSlug('__theme_preview__');
      }
      setCurrentMode('tenant');
      return;
    }

    if (tenantParam || pathSlug) {
      const targetSlug = (tenantParam || pathSlug || 'royal').toLowerCase();
      setActiveSlug(targetSlug);
      setMarketingThemeId(undefined);
      setIsMarketingShareMode(false);
      setCurrentMode('tenant');
      return;
    }

    // 3. Otherwise, on the Main Page (/):
    // If logged in, go directly to Super Admin or Business Owner Dashboard; otherwise show the Single Unified Login Page
    if (resolvedUser) {
      if (resolvedUser.role === 'superadmin') {
        setCurrentMode('admin');
      } else if (resolvedUser.role === 'owner') {
        if (resolvedTenant?.slug) {
          setActiveSlug(resolvedTenant.slug);
        }
        setCurrentMode('owner');
      } else {
        setCurrentMode('platform');
      }
    } else {
      setCurrentMode('platform');
    }
  };

  const handleSelectTenant = (slug: string, themeOverride?: RoyalThemeId) => {
    const isPureThemeShowcase = Boolean(themeOverride && (!slug || slug === '__theme_preview__'));
    setActiveSlug(isPureThemeShowcase ? '__theme_preview__' : slug);
    setMarketingThemeId(themeOverride);
    setIsMarketingShareMode(isPureThemeShowcase);
    setCurrentMode('tenant');
    const url = new URL(window.location.href);
    if (isPureThemeShowcase && themeOverride) {
      url.searchParams.delete('tenant');
      url.searchParams.set('theme', themeOverride);
    } else if (themeOverride) {
      url.searchParams.set('tenant', slug);
      url.searchParams.set('theme', themeOverride);
    } else {
      url.searchParams.delete('theme');
      url.searchParams.set('tenant', slug);
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleChangeMarketingTheme = (nextThemeId: RoyalThemeId) => {
    setMarketingThemeId(nextThemeId);
    const url = new URL(window.location.href);
    url.searchParams.set('theme', nextThemeId);
    window.history.pushState({}, '', url.toString());
  };

  const handleSelectPlatform = () => {
    setCurrentMode('platform');
    setMarketingThemeId(undefined);
    setIsMarketingShareMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('tenant');
    url.searchParams.delete('theme');
    window.history.pushState({}, '', url.toString());
  };

  const handleLoginSuccess = (user: any, tenant: any) => {
    setCurrentUser(user);
    setCurrentTenant(tenant);
    const url = new URL(window.location.href);
    url.searchParams.delete('tenant');
    url.searchParams.delete('theme');
    window.history.pushState({}, '', url.toString());

    if (user.role === 'superadmin') {
      setCurrentMode('admin');
    } else if (user.role === 'owner') {
      if (tenant?.slug) {
        setActiveSlug(tenant.slug);
      }
      setCurrentMode('owner');
    }
  };

  const handleLogout = () => {
    saasApi.logout();
    signOutFirebase().catch(() => {});
    setCurrentUser(null);
    setCurrentTenant(null);
    handleSelectPlatform();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Show 'Back to Dashboard' bar ONLY when a logged-in Owner or Super Admin is previewing a live website */}
      {currentMode === 'tenant' && currentUser && (
        <div className="bg-neutral-950 border-b border-neutral-800 text-white text-xs sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentMode(currentUser.role === 'superadmin' ? 'admin' : 'owner')
                }
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  Back to {currentUser.role === 'superadmin' ? 'Super Admin Console' : 'Business Dashboard'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                {currentUser.role === 'superadmin' ? (
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                )}
                <strong className="text-white">{currentUser.name}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main View Switching */}
      <div className="flex-1">
        {currentMode === 'platform' && (
          <PlatformLanding
            onSelectTenant={handleSelectTenant}
            onLoginSuccess={handleLoginSuccess}
            onOpenLogin={(role) => {
              setAuthDefaultRole(role || 'owner');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentMode === 'tenant' && (
          <PublicSalonSite
            slug={activeSlug}
            overrideThemeId={marketingThemeId}
            isMarketingShareMode={isMarketingShareMode}
            onChangeMarketingTheme={handleChangeMarketingTheme}
            onOpenOwnerLogin={handleSelectPlatform}
          />
        )}

        {currentMode === 'owner' && (
          <OwnerDashboard
            tenantId={currentTenant?.id || (currentUser?.tenantId ?? 'ten_royal_001')}
            onViewPublicSite={(slug) => handleSelectTenant(slug)}
            onLogout={handleLogout}
          />
        )}

        {currentMode === 'admin' && (
          <SuperAdminPanel
            onViewTenantSite={(slug, themeId) => handleSelectTenant(slug, themeId)}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Auth Modal fallback */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        defaultRole={authDefaultRole}
        activeSlug={activeSlug}
      />
    </div>
  );
}

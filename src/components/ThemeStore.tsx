import React, { useState, useEffect } from 'react';
import {
  Check,
  Monitor,
  Smartphone,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Copy,
  Share2,
} from 'lucide-react';
import { RoyalThemeId } from '../types/saas.ts';
import {
  ROYAL_THEMES,
  ALLOWED_ROYAL_THEMES,
  resolveSafeThemeId,
} from '../config/themes.ts';
import { saasApi } from '../services/api.ts';
import { PublicSalonSite } from './PublicSalonSite.tsx';

interface ThemeStoreProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  currentThemeId?: string;
  onThemePublished: (newThemeId: RoyalThemeId, updatedSettings: any) => void;
  onViewPublicSite: (slug: string) => void;
  onOpenFullCustomizer?: (subTab?: 'themes' | 'photos' | 'typography' | 'layout' | 'hours' | 'reviews') => void;
}

export const ThemeStore: React.FC<ThemeStoreProps> = ({
  tenantId,
  tenantSlug,
  tenantName,
  currentThemeId,
  onThemePublished,
  onViewPublicSite,
  onOpenFullCustomizer,
}) => {
  const persistedThemeId = resolveSafeThemeId(currentThemeId, 'royal-gold');
  const [liveThemeId, setLiveThemeId] = useState<RoyalThemeId>(persistedThemeId);
  const [previewThemeId, setPreviewThemeId] = useState<RoyalThemeId>(persistedThemeId);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showLivePreviewStage, setShowLivePreviewStage] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getShareableThemeUrl = (themeId: RoyalThemeId) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?tenant=${encodeURIComponent(tenantSlug)}&theme=${encodeURIComponent(themeId)}`;
  };

  const handleCopyShareLink = (key: string, url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setSuccessMsg(`Shareable marketing link copied for ${label}: ${url}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    const resolved = resolveSafeThemeId(currentThemeId, 'royal-gold');
    setLiveThemeId(resolved);
    setPreviewThemeId(resolved);
  }, [currentThemeId]);

  const handlePublishTheme = async (targetThemeId: RoyalThemeId) => {
    setPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saasApi.updateOwnerTheme(tenantId, targetThemeId);
      setLiveThemeId(res.themeId);
      setPreviewThemeId(res.themeId);
      setSuccessMsg(res.message);
      onThemePublished(res.themeId, res.settings);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish theme.');
    } finally {
      setPublishing(false);
    }
  };

  const activeThemeTokens = ROYAL_THEMES[liveThemeId];
  const previewThemeTokens = ROYAL_THEMES[previewThemeId];
  const hasUnpublishedPreview = previewThemeId !== liveThemeId;

  return (
    <div className="space-y-8">
      {/* Top Header & Status Bar */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 font-medium">
            Website Appearance · {tenantName} (?tenant={tenantSlug})
          </div>
          <h3 className="text-xl font-serif font-bold text-neutral-900 mt-1">
            Royal & Luxe Salon Theme Store (6 Official Themes)
          </h3>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
            Preview and publish any of the 6 luxury salon themes below (including <strong>Rosé Luxe Pink</strong>), or open the <strong>Shopify-Style Visual Theme Editor</strong> to click and edit any section, photo, text, color, or service card live on your website.
          </p>
          {onOpenFullCustomizer && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => onOpenFullCustomizer('themes')}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>✦ Open Shopify-Style Visual Theme Editor</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenFullCustomizer('photos')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Customize Photos & Logo
              </button>
              <button
                type="button"
                onClick={() => onOpenFullCustomizer('typography')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Customize Letters, Fonts & Text
              </button>
              <button
                type="button"
                onClick={() => onOpenFullCustomizer('layout')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Customize Sections & Order
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="text-xs text-neutral-600 px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
            <span>Live Theme: </span>
            <strong className="text-neutral-900 font-semibold">{activeThemeTokens.name}</strong>
          </div>

          <button
            type="button"
            onClick={() => {
              const liveUrl = `${window.location.origin}${window.location.pathname}?tenant=${encodeURIComponent(tenantSlug)}`;
              handleCopyShareLink('live_site', liveUrl, tenantName);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === 'live_site' ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'live_site' ? 'Website Link Copied!' : 'Copy Website Share Link'}</span>
          </button>

          <button
            onClick={() => onViewPublicSite(tenantSlug)}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Live Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Five Visually Distinct Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALLOWED_ROYAL_THEMES.map((themeKey) => {
          const theme = ROYAL_THEMES[themeKey];
          const isCurrentLive = liveThemeId === theme.id;
          const isCurrentPreview = previewThemeId === theme.id;

          return (
            <div
              key={theme.id}
              data-testid={`theme-card-${theme.id}`}
              className={`bg-white rounded-xl overflow-hidden border transition-all flex flex-col justify-between ${
                isCurrentPreview
                  ? 'border-neutral-900 ring-2 ring-neutral-900/15'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Genuine Rendered Theme Preview Thumbnail */}
                <div
                  className="relative aspect-[16/9] border-b border-neutral-100 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setPreviewThemeId(theme.id);
                    setShowLivePreviewStage(true);
                  }}
                >
                  <img
                    src={theme.previewSvgDataUri}
                    alt={`${theme.name} theme preview`}
                    className="w-full h-full object-cover"
                  />

                  {/* Top-Right Status Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isCurrentLive && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active Theme</span>
                      </span>
                    )}
                    {!isCurrentLive && isCurrentPreview && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-900/90 text-amber-300 border border-amber-500/40">
                        Previewing
                      </span>
                    )}
                  </div>

                  {/* Color Palette Swatches Strip */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-md">
                    {theme.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white/40"
                        style={{ backgroundColor: hex }}
                        title={`Palette token ${hex}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Card Copy */}
                <div className="p-5">
                  <div className="text-xs text-neutral-500">
                    {theme.tagline}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-neutral-900 mt-0.5">
                    {theme.name}
                  </h4>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewThemeId(theme.id);
                      setShowLivePreviewStage(true);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrentPreview
                        ? 'bg-neutral-200 text-neutral-900 font-semibold'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isCurrentPreview ? 'Previewing Below' : 'Preview Theme'}</span>
                  </button>

                  {isCurrentLive ? (
                    <span className="px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1 whitespace-nowrap shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span>Published</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={() => handlePublishTheme(theme.id)}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {publishing && previewThemeId === theme.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      <span>Select Theme</span>
                    </button>
                  )}
                </div>

                {/* Shareable Marketing Link Row */}
                <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyShareLink(
                        `theme_${theme.id}`,
                        getShareableThemeUrl(theme.id),
                        `${theme.name} Theme`
                      )
                    }
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      copiedKey === `theme_${theme.id}`
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {copiedKey === `theme_${theme.id}` ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Share Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Shareable Theme Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `✨ *${tenantName} — ${theme.name} Theme*\n\nहमारी सैलून वेबसाइट और थीम का लाइव डेमो यहाँ देखें:\n👉 ${getShareableThemeUrl(theme.id)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Share Theme on WhatsApp for Marketing"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Desktop & Mobile Theme Preview Workspace */}
      {showLivePreviewStage && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {/* Preview Toolbar */}
          <div className="px-6 py-4 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400">Interactive Live Preview:</span>
                  <strong className="text-white font-semibold">{previewThemeTokens.name}</strong>
                  <span className="text-neutral-500">·</span>
                  <span className="text-neutral-300">
                    {hasUnpublishedPreview ? 'Unpublished Draft Preview' : 'Currently Live on Website'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Rendered with your real salon services, pricing, gallery, and booking form.
                </p>
              </div>
            </div>

            {/* Viewport Mode Controls (Desktop vs Mobile) & Publish Action */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-neutral-800 rounded-lg border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    viewportMode === 'desktop'
                      ? 'bg-white text-neutral-900 font-semibold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    viewportMode === 'mobile'
                      ? 'bg-white text-neutral-900 font-semibold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (390px)</span>
                </button>
              </div>

              {hasUnpublishedPreview && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewThemeId(liveThemeId)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Preview</span>
                  </button>

                  <button
                    type="button"
                    disabled={publishing}
                    onClick={() => handlePublishTheme(previewThemeId)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Publish {previewThemeTokens.name} Theme</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Viewport Container */}
          <div className="bg-neutral-200/70 p-4 sm:p-6 flex justify-center overflow-x-auto">
            <div
              className={`bg-white border border-neutral-300 rounded-xl overflow-hidden shadow-lg transition-all duration-200 ${
                viewportMode === 'mobile'
                  ? 'w-[390px] max-w-full'
                  : 'w-full'
              }`}
              style={{ maxHeight: '760px', overflowY: 'auto' }}
            >
              <PublicSalonSite
                slug={tenantSlug}
                overrideThemeId={previewThemeId}
                previewMode={viewportMode}
                isEmbeddedPreview={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

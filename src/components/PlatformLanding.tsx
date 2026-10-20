import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  UserCheck,
  Shield,
  Store,
  Sparkles,
} from 'lucide-react';
import { saasApi } from '../services/api.ts';
import { signInWithGooglePopup } from '../firebase.ts';
import { ROYAL_THEME_LIST } from '../config/themes.ts';
import { RoyalThemeId } from '../types/saas.ts';

interface PlatformLandingProps {
  onSelectTenant: (slug: string, themeId?: RoyalThemeId) => void;
  onOpenLogin?: (role?: 'superadmin' | 'owner') => void;
  onLoginSuccess?: (user: any, tenant: any) => void;
}

export const PlatformLanding: React.FC<PlatformLandingProps> = ({
  onSelectTenant,
  onLoginSuccess,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoHelper, setShowDemoHelper] = useState(false);
  const [showThemeShareDrawer, setShowThemeShareDrawer] = useState(false);
  const [copiedThemeId, setCopiedThemeId] = useState<string | null>(null);

  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError('कृपया अपना Login ID और Password दर्ज करें। (Please enter Login ID & Password)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await saasApi.login(loginId.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.tenant);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Login ID or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithGooglePopup();
      if (!fbUser.email) {
        throw new Error('Google account does not have an email address.');
      }
      const res = await saasApi.loginWithFirebase({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
      });
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.tenant);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillCredentials = (id: string, pass: string) => {
    setError(null);
    setLoginId(id);
    setPassword(pass);
  };

  const getShareableThemeUrl = (themeId: RoyalThemeId) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?theme=${encodeURIComponent(themeId)}`;
  };

  const handleCopyThemeLink = (themeId: RoyalThemeId) => {
    const url = getShareableThemeUrl(themeId);
    navigator.clipboard.writeText(url);
    setCopiedThemeId(themeId);
    setTimeout(() => setCopiedThemeId(null), 2500);
  };

  const handleWhatsAppShareTheme = (themeName: string, themeId: RoyalThemeId) => {
    const url = getShareableThemeUrl(themeId);
    const text = `✨ *${themeName} — Luxury Salon & Bridal Parlour Website Theme*\n\nइस लाइव वेबसाइट डेमो को देखने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n👉 ${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle Ambient Luxury Glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.14), transparent 45%), radial-gradient(circle at 80% 80%, rgba(216, 90, 127, 0.14), transparent 45%)',
        }}
      />

      {/* Minimal Top Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center font-serif font-bold text-lg shadow-lg">
            G
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-wide text-white block leading-none">
              GlamHub Portal
            </span>
            <span className="text-[11px] text-stone-400 tracking-wider uppercase">
              Unified Business & Super Admin Access
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowThemeShareDrawer(!showThemeShareDrawer)}
          className="px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-amber-300 text-xs font-medium transition-colors flex items-center gap-2"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Shareable Marketing Themes (6)</span>
        </button>
      </header>

      {/* Center Unified Single Login Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-3xl p-7 sm:p-9 shadow-2xl">
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
                Portal Sign In
              </h1>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                Business Owner और Super Owner (Super Admin) दोनों यहाँ एक ही जगह से अपनी Login ID और Password से लॉगिन करें।
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUnifiedLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Login ID / Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter Business Login ID or Admin Email"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-950/90 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-stone-950/90 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>Login to Dashboard</span>
              </button>
            </form>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-stone-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-stone-500 uppercase tracking-wider">
                Or
              </span>
              <div className="flex-grow border-t border-stone-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Continue with Google Account</span>
            </button>

            {/* Discreet Quick Fill Helper for testing */}
            <div className="mt-6 pt-4 border-t border-stone-800/80">
              <button
                type="button"
                onClick={() => setShowDemoHelper(!showDemoHelper)}
                className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-stone-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Fill Default Login IDs</span>
                </span>
                <span>{showDemoHelper ? 'Hide' : 'Show'}</span>
              </button>

              {showDemoHelper && (
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@glamhub.com', 'SuperAdmin2026!')}
                    className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-200">Super Owner (Super Admin)</div>
                        <div className="text-[11px] font-mono text-stone-400">admin@glamhub.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('owner.glamour@glamhub.com', 'GlamPass123!')}
                    className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-200">Business Owner (Rosé Luxe Salon)</div>
                        <div className="text-[11px] font-mono text-stone-400">owner.glamour@glamhub.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('owner.royal@glamhub.com', 'RoyalPass123!')}
                    className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-200">Business Owner (Royal Blossom)</div>
                        <div className="text-[11px] font-mono text-stone-400">owner.royal@glamhub.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">Fill</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Customer PWA Apps Launcher */}
            <div className="mt-8 pt-6 border-t border-stone-800">
              <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3 text-center">
                ✨ Direct Customer Apps (PWA)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectTenant('royal')}
                  className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-left flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-serif font-bold shrink-0">
                    R
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-300">Royal Beauty</div>
                    <div className="text-[10px] text-stone-400">Customer App</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTenant('glamour')}
                  className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-left flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-serif font-bold shrink-0">
                    G
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-rose-300">Rosé Luxe</div>
                    <div className="text-[10px] text-stone-400">Customer App</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Shareable Marketing Themes Modal / Drawer */}
      {showThemeShareDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Marketing & Client Demo Links</span>
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white mt-0.5">
                  6 Official Luxury Themes — Shareable Marketing Links
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  किसी भी थीम का लिंक कॉपी करें या सीधे WhatsApp पर क्लाइंट को भेजें ताकि वे लाइव थीम देख सकें।
                </p>
              </div>
              <button
                onClick={() => setShowThemeShareDrawer(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROYAL_THEME_LIST.map((theme) => {
                const shareUrl = getShareableThemeUrl(theme.id);
                const isCopied = copiedThemeId === theme.id;
                const demoSlug = theme.id === 'rose-luxe' ? 'glamour' : 'royal';

                return (
                  <div
                    key={theme.id}
                    className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-32 relative overflow-hidden bg-stone-900">
                        <img
                          src={theme.previewSvgDataUri}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-semibold text-amber-300 border border-white/10">
                          {theme.badge}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-serif font-bold text-base text-white">{theme.name}</h3>
                        <p className="text-xs text-stone-400 mt-0.5">{theme.subtitle}</p>

                        <div className="mt-3 p-2 rounded-lg bg-stone-900 border border-stone-800 font-mono text-[11px] text-stone-300 truncate">
                          {shareUrl}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyThemeLink(theme.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Share Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppShareTheme(theme.name, theme.id)}
                        className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowThemeShareDrawer(false);
                          onSelectTenant(demoSlug, theme.id);
                        }}
                        className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Open Live Demo"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-stone-500">
        GlamHub Luxury Salon Platform · Single Unified Login for Super Admin & Business Owners
      </footer>
    </div>
  );
};

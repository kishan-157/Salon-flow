import React, { useState } from 'react';
import {
  Globe,
  Shield,
  Store,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Lock,
  Sparkles,
} from 'lucide-react';

interface TenantBarProps {
  currentMode: 'platform' | 'tenant' | 'owner' | 'admin';
  activeSlug: string;
  onSelectTenant: (slug: string) => void;
  onSelectPlatform: () => void;
  onSelectOwner: (slug?: string) => void;
  onSelectAdmin: () => void;
  currentUser: any;
  onLogout: () => void;
}

export const TenantBar: React.FC<TenantBarProps> = ({
  currentMode,
  activeSlug,
  onSelectTenant,
  onSelectPlatform,
  onSelectOwner,
  onSelectAdmin,
  currentUser,
  onLogout,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customHost, setCustomHost] = useState('');

  const demoTenants = [
    { slug: 'royal', name: 'Royal Blossom Couture & Spa', plan: 'Pro', status: 'active', desc: 'Royal Gold Theme (Active Pro)' },
    { slug: 'glamour', name: 'Rosé Luxe Salon & Spa', plan: 'Growth', status: 'active', desc: 'Rosé Luxe Pink Theme (Active)' },
    { slug: 'aura', name: 'Aura Botanical Salon', plan: 'Starter', status: 'expired', desc: 'Organic head spa (Subscription Expired)' },
    { slug: 'velvet', name: 'Velvet Chic Parlour', plan: 'Growth', status: 'suspended', desc: 'Express nail studio (Suspended by Admin)' },
  ];

  const handleSimulateHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHost.trim()) return;
    const clean = customHost.trim().replace('.glamhub.com', '').toLowerCase();
    onSelectTenant(clean);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 text-white text-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Current Domain / Subdomain Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-rose-400">
            <Sparkles className="w-4 h-4" />
            <span>GlamHub Multi-Tenant Engine</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300">
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span>Active Host:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {currentMode === 'tenant'
                ? `${activeSlug}.glamhub.com`
                : currentMode === 'owner'
                ? `dashboard.glamhub.com/t/${activeSlug}`
                : currentMode === 'admin'
                ? 'admin.glamhub.com'
                : 'glamhub.com (Central SaaS Platform)'}
            </span>
          </div>
        </div>

        {/* Middle: Quick navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={onSelectPlatform}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              currentMode === 'platform'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            SaaS Portal
          </button>

          <button
            onClick={() => onSelectTenant('royal')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              currentMode === 'tenant' && activeSlug === 'royal'
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title="Royal Blossom Couture & Spa"
          >
            <Store className="w-3 h-3" />
            <span>royal.glamhub.com</span>
          </button>

          <button
            onClick={() => onSelectTenant('glamour')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              currentMode === 'tenant' && activeSlug === 'glamour'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-700 text-pink-300'
            }`}
            title="Rosé Luxe Pink Salon"
          >
            <Store className="w-3 h-3" />
            <span>Rosé Luxe Pink (glamour)</span>
          </button>

          <button
            onClick={() => onSelectOwner(activeSlug || 'royal')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              currentMode === 'owner'
                ? 'bg-amber-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Owner Dashboard</span>
          </button>

          <button
            onClick={onSelectAdmin}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              currentMode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Right: Subdomain switcher toggler & User Info */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-700">
              <span className="text-neutral-400">
                Logged in as <strong className="text-neutral-200">{currentUser.name.split(' ')[0]}</strong> ({currentUser.role})
              </span>
              <button
                onClick={onLogout}
                className="text-neutral-400 hover:text-rose-400 transition-colors underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
            >
              <span>Subdomain Tester</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}

          {!currentUser && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden p-1 text-neutral-400"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Subdomain Tester & Test Tenancy Details */}
      {isExpanded && (
        <div className="bg-neutral-950 border-t border-neutral-800 p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-rose-400" />
                <span>Simulate Subdomain Host Resolution (Phase 3)</span>
              </h4>
              <p className="text-neutral-400 text-xs mb-3">
                Type any subdomain to test server-side hostname normalization, 404 handling, and malformed host safety.
              </p>
              <form onSubmit={handleSimulateHost} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="e.g. royal, glamour, aura, velvet, or unknown-salon"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="absolute right-3 top-1.5 text-neutral-500 pointer-events-none font-mono">
                    .glamhub.com
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white font-medium transition-colors"
                >
                  Resolve Host
                </button>
              </form>
            </div>

            <div>
              <h4 className="font-medium text-neutral-300 mb-2">Available Multi-Tenant Environments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoTenants.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => {
                      onSelectTenant(t.slug);
                      setIsExpanded(false);
                    }}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 rounded border border-neutral-800 text-left flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-medium text-neutral-200 group-hover:text-rose-400 flex items-center gap-1.5">
                        <span>{t.slug}.glamhub.com</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-neutral-400">{t.desc}</div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        t.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : t.status === 'expired'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

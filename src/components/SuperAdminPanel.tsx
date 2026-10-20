import React, { useState, useEffect } from 'react';
import {
  Shield,
  Store,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Loader2,
  Layers,
  Share2,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { saasApi } from '../services/api.ts';
import { Tenant, AuditLog, RoyalThemeId } from '../types/saas.ts';
import { SAAS_PLANS } from '../config/plans.ts';
import { ROYAL_THEME_LIST, ROYAL_THEMES, resolveSafeThemeId } from '../config/themes.ts';

interface SuperAdminPanelProps {
  onViewTenantSite: (slug: string, themeOverride?: RoyalThemeId) => void;
  onLogout: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onViewTenantSite, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'marketing-themes' | 'audit' | 'plans'>('tenants');
  const [overview, setOverview] = useState<any | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Tenant Modal
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newPlanId, setNewPlanId] = useState('growth');
  const [newThemeId, setNewThemeId] = useState<RoyalThemeId>('rose-luxe');

  // Edit Credentials Modal
  const [isEditCredsModalOpen, setIsEditCredsModalOpen] = useState(false);
  const [credTenant, setCredTenant] = useState<Tenant | null>(null);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerLoginId, setEditOwnerLoginId] = useState('');
  const [editOwnerPassword, setEditOwnerPassword] = useState('');
  const [editThemeId, setEditThemeId] = useState<RoyalThemeId>('rose-luxe');

  // Renewal Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewTenant, setRenewTenant] = useState<Tenant | null>(null);
  const [renewPlanName, setRenewPlanName] = useState('Luxury Pro & Spa');
  const [renewAmount, setRenewAmount] = useState('149');
  const [renewMonths, setRenewMonths] = useState('12');
  const [renewNotes, setRenewNotes] = useState('Manual bank wire transfer verified');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [ov, tList, logs] = await Promise.all([
        saasApi.getAdminOverview(),
        saasApi.getAdminTenants(),
        saasApi.getAdminAuditLogs(),
      ]);
      setOverview(ov);
      setTenants(tList);
      setAuditLogs(logs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load platform admin data');
    } finally {
      setLoading(false);
    }
  };

  const triggerCopy = (key: string, text: string, msg?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (msg) {
      setSuccessMessage(msg);
    }
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getBaseAppUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const getTenantShareUrl = (slug: string) => {
    return `${getBaseAppUrl()}?tenant=${encodeURIComponent(slug)}`;
  };

  const getThemeMarketingUrl = (themeId: RoyalThemeId) => {
    return `${getBaseAppUrl()}?theme=${encodeURIComponent(themeId)}`;
  };

  const getDefaultDemoPassword = (slug: string, settings?: any) => {
    if (settings?.ownerPasswordHint) return settings.ownerPasswordHint;
    if (slug === 'royal') return 'RoyalPass123!';
    if (slug === 'glamour') return 'GlamPass123!';
    if (slug === 'aura') return 'AuraPass123!';
    if (slug === 'velvet') return 'VelvetPass123!';
    return '(Set via Edit Login ID)';
  };

  const handleCopyOwnerCredentials = (t: Tenant) => {
    const loginUrl = getBaseAppUrl();
    const siteUrl = getTenantShareUrl(t.slug);
    const passHint = getDefaultDemoPassword(t.slug, t.settings);
    const text = `🔐 *${t.name} — Business Owner Login Details*\n\n🌐 *Unified Login Portal:* ${loginUrl}\n👤 *Login ID:* ${t.owner_email}\n🔑 *Password:* ${passHint}\n\n✨ *Your Live Salon Website Link:* ${siteUrl}`;
    triggerCopy(
      `creds_${t.id}`,
      text,
      `Copied Login ID (${t.owner_email}) & credentials for '${t.name}'!`
    );
  };

  const handleWhatsAppOwnerCredentials = (t: Tenant) => {
    const loginUrl = getBaseAppUrl();
    const siteUrl = getTenantShareUrl(t.slug);
    const passHint = getDefaultDemoPassword(t.slug, t.settings);
    const text = `✨ *${t.name} — Business Owner Portal Access*\n\nनमस्ते! आपके ब्यूटी पार्लर का अकाउंट तैयार है। आप नीचे दिए गए लिंक और Login ID से लॉगिन कर सकते हैं:\n\n🔐 *Login Page:* ${loginUrl}\n👤 *Login ID:* ${t.owner_email}\n🔑 *Password:* ${passHint}\n\n🌐 *आपकी लाइव वेबसाइट का लिंक:* ${siteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await saasApi.createTenant({
        name: newTenantName,
        slug: newTenantSlug,
        owner_name: newOwnerName,
        owner_email: newOwnerEmail,
        owner_password: newOwnerPassword,
        plan_id: newPlanId,
        theme_id: newThemeId,
      });

      setSuccessMessage(
        `Business '${newTenantName}' created! Business Owner can now log in on the main page with Login ID: '${newOwnerEmail}'.`
      );
      setIsNewTenantModalOpen(false);
      setNewTenantName('');
      setNewTenantSlug('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewOwnerPassword('');

      const [ov, tList] = await Promise.all([saasApi.getAdminOverview(), saasApi.getAdminTenants()]);
      setOverview(ov);
      setTenants(tList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register salon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditCredentials = (t: Tenant) => {
    setCredTenant(t);
    setEditOwnerName(t.owner_name || '');
    setEditOwnerLoginId(t.owner_email || '');
    setEditOwnerPassword((t.settings as any)?.ownerPasswordHint || '');
    setEditThemeId(resolveSafeThemeId(t.settings?.themeId, 'rose-luxe'));
    setIsEditCredsModalOpen(true);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credTenant) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await saasApi.updateTenantCredentials(credTenant.id, {
        owner_name: editOwnerName,
        owner_email: editOwnerLoginId,
        owner_password: editOwnerPassword,
        theme_id: editThemeId,
      });
      setSuccessMessage(res.message);
      setIsEditCredsModalOpen(false);
      const tList = await saasApi.getAdminTenants();
      setTenants(tList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update owner credentials');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTenantStatus = async (tenant: Tenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    try {
      await saasApi.updateTenantStatus(
        tenant.id,
        nextStatus,
        nextStatus === 'suspended' ? 'Administrative suspension' : 'Administrative reactivation'
      );
      setSuccessMessage(`Salon '${tenant.name}' status updated to ${nextStatus}.`);
      const [ov, tList, logs] = await Promise.all([
        saasApi.getAdminOverview(),
        saasApi.getAdminTenants(),
        saasApi.getAdminAuditLogs(),
      ]);
      setOverview(ov);
      setTenants(tList);
      setAuditLogs(logs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update tenant status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTenant) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await saasApi.renewSubscription(renewTenant.id, {
        plan_name: renewPlanName,
        amount: Number(renewAmount),
        period_months: Number(renewMonths),
        notes: renewNotes,
      });

      setSuccessMessage(res.message);
      setIsRenewModalOpen(false);

      const [ov, tList] = await Promise.all([saasApi.getAdminOverview(), saasApi.getAdminTenants()]);
      setOverview(ov);
      setTenants(tList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record subscription renewal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async (tenantId: string, planId: string) => {
    try {
      await saasApi.updateTenantPlan(tenantId, planId);
      setSuccessMessage(`Plan updated to ${SAAS_PLANS[planId].name}.`);
      const tList = await saasApi.getAdminTenants();
      setTenants(tList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-neutral-600">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <h3 className="text-base font-medium text-neutral-800">Authenticating Super Admin Session</h3>
        <p className="text-xs text-neutral-500">Loading businesses, owner login IDs, and marketing theme links...</p>
      </div>
    );
  }

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.owner_email && t.owner_email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-neutral-900 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">GlamHub Super Admin Console</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  Super Owner
                </span>
              </div>
              <div className="text-xs text-neutral-400">
                Create Businesses, Manage Owner Login IDs, & Share Marketing Theme Links
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketing-themes')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Shareable Theme Links (6)</span>
            </button>

            <button
              onClick={loadAdminData}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto border-t border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'tenants'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Businesses & Owner Login IDs ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('marketing-themes')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'marketing-themes'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Marketing Theme Share Links (6 Themes)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Access Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SaaS Plan Definitions</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
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

        {/* Platform Overview Metric Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Total Salons</div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">{overview.totalTenants}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Active Salons</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{overview.activeTenants}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Suspended Salons</div>
              <div className="text-xl font-bold text-rose-600 mt-0.5">{overview.suspendedTenants}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Expired Subs</div>
              <div className="text-xl font-bold text-amber-600 mt-0.5">{overview.expiredTenants}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Platform Bookings</div>
              <div className="text-xl font-bold text-blue-600 mt-0.5">{overview.totalBookings}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <div className="text-[11px] font-medium text-neutral-500">Manual Revenue</div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">${overview.totalRevenueCollected}</div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: SALON TENANTS & BUSINESS OWNER LOGIN IDS */}
        {/* ==================================================== */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search business name, slug, Login ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-semibold">Status:</span>
                  {['all', 'active', 'suspended'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsNewTenantModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Business & Owner Login ID</span>
              </button>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Business & Shareable Website Link</th>
                      <th className="py-3 px-4">Business Owner Login ID & Password</th>
                      <th className="py-3 px-4">Active Theme</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-neutral-400">
                          No businesses found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => {
                        const isExpired =
                          t.subscription_status === 'expired' ||
                          new Date(t.subscription_expires_at) < new Date();
                        const activeThemeId = resolveSafeThemeId(t.settings?.themeId, 'royal-gold');
                        const themeObj = ROYAL_THEMES[activeThemeId];
                        const passHint = getDefaultDemoPassword(t.slug, t.settings);
                        const shareUrl = getTenantShareUrl(t.slug);

                        return (
                          <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                            {/* Business & Website Link */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-neutral-900 text-sm">{t.name}</div>
                              <div className="text-neutral-500 font-mono text-[11px] flex items-center gap-2 mt-1">
                                <span className="truncate max-w-[180px]" title={shareUrl}>
                                  ?tenant={t.slug}
                                </span>
                                <button
                                  onClick={() => onViewTenantSite(t.slug)}
                                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Open Live Website"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    triggerCopy(
                                      `site_${t.id}`,
                                      shareUrl,
                                      `Copied shareable website link for ${t.name}!`
                                    )
                                  }
                                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sans font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Copy Shareable Website Link"
                                >
                                  {copiedKey === `site_${t.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedKey === `site_${t.id}` ? 'Copied' : 'Share Link'}</span>
                                </button>
                              </div>
                            </td>

                            {/* Owner Login ID & Password */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-neutral-900">{t.owner_name || 'Owner'}</div>
                              <div className="mt-1 space-y-0.5 text-[11px] font-mono">
                                <div>
                                  <span className="text-neutral-400 font-sans">Login ID: </span>
                                  <strong className="text-blue-700">{t.owner_email}</strong>
                                </div>
                                <div>
                                  <span className="text-neutral-400 font-sans">Password: </span>
                                  <span className="text-neutral-700">{passHint}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyOwnerCredentials(t)}
                                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === `creds_${t.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>
                                    {copiedKey === `creds_${t.id}` ? 'Copied!' : 'Copy Login ID'}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleWhatsAppOwnerCredentials(t)}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold cursor-pointer"
                                >
                                  WhatsApp ID
                                </button>

                                <button
                                  onClick={() => handleOpenEditCredentials(t)}
                                  className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Change Login ID or Password"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit ID</span>
                                </button>
                              </div>
                            </td>

                            {/* Active Theme */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-neutral-900">{themeObj.name}</div>
                              <div className="text-[11px] text-neutral-500">{themeObj.tagline}</div>
                            </td>

                            {/* Account Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                  t.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {t.status}
                              </span>
                              <div className="text-[10px] text-neutral-400 mt-1">
                                Exp: {new Date(t.subscription_expires_at).toLocaleDateString()}{' '}
                                {isExpired ? '(EXPIRED)' : ''}
                              </div>
                            </td>

                            {/* Subscription Plan */}
                            <td className="py-3.5 px-4">
                              <select
                                value={t.plan_id}
                                onChange={(e) => handleChangePlan(t.id, e.target.value)}
                                className="px-2 py-1 bg-neutral-50 border border-neutral-300 rounded font-medium text-neutral-800 text-[11px]"
                              >
                                {Object.values(SAAS_PLANS).map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (${p.price}/mo)
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Admin Controls */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setRenewTenant(t);
                                    setRenewPlanName(SAAS_PLANS[t.plan_id]?.name || 'Growth Studio');
                                    setIsRenewModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Renew Sub
                                </button>

                                <button
                                  onClick={() => handleToggleTenantStatus(t)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                    t.status === 'active'
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  {t.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SHAREABLE MARKETING THEME LINKS (6 THEMES) */}
        {/* ==================================================== */}
        {activeTab === 'marketing-themes' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 text-white rounded-2xl p-6 border border-neutral-800 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Marketing & Client Acquisition Toolkit</span>
                </div>
                <h3 className="text-xl font-serif font-bold mt-1">
                  Shareable Theme Links — 6 Official Luxury Salon Themes
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
                  यहाँ से आप अपनी किसी भी थीम का सीधा Shareable Link कॉपी कर सकते हैं या WhatsApp पर क्लाइंट्स को मार्केटिंग के लिए भेज सकते हैं। जब कोई लिंक खोलेगा तो उसे पूरी लाइव थीम दिखेगी।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ROYAL_THEME_LIST.map((theme) => {
                const shareUrl = getThemeMarketingUrl(theme.id);
                const isCopied = copiedKey === `theme_${theme.id}`;
                const demoSlug = theme.id === 'rose-luxe' ? 'glamour' : 'royal';

                return (
                  <div
                    key={theme.id}
                    className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 bg-neutral-900 relative overflow-hidden">
                        <img
                          src={theme.previewSvgDataUri}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-white/15">
                          {theme.badge}
                        </div>
                      </div>

                      <div className="p-5">
                        <h4 className="text-base font-serif font-bold text-neutral-900">
                          {theme.name}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">{theme.subtitle}</p>

                        <div className="mt-4">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                            Shareable Marketing Link
                          </label>
                          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-700 break-all">
                            {shareUrl}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            triggerCopy(
                              `theme_${theme.id}`,
                              shareUrl,
                              `Copied shareable marketing link for '${theme.name}'!`
                            )
                          }
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied Share Link!</span>
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
                          onClick={() => {
                            const text = `✨ *${theme.name} — Luxury Beauty Parlour & Bridal Salon Website Theme*\n\nइस प्रीमियम सैलून वेबसाइट थीम का लाइव डेमो देखने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n👉 ${shareUrl}`;
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(text)}`,
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }}
                          className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          WhatsApp Share
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewTenantSite(demoSlug, theme.id)}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Open Live Theme Preview</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: AUDIT & SECURITY ACCESS LOGS */}
        {/* ==================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Security & Isolation Event Logs</h3>
                <p className="text-xs text-neutral-500">
                  Records all cross-tenant access attempts, permission breaches, and administrative state changes.
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-500">{auditLogs.length} events captured</span>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Event Details & Incident Description</th>
                      <th className="py-3 px-4">Target Tenant</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-400 font-sans">
                          No security access incidents logged.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        const isViolation =
                          log.action.includes('DENIED') ||
                          log.action.includes('UNAUTHORIZED') ||
                          log.action.includes('BREACH');
                        return (
                          <tr key={log.id} className="hover:bg-neutral-50">
                            <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleTimeString()} {new Date(log.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isViolation
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-sans text-neutral-700 max-w-md">
                              {log.details}
                            </td>
                            <td className="py-2.5 px-4 text-neutral-500">
                              {log.tenant_id || 'System'}
                            </td>
                            <td className="py-2.5 px-4 text-neutral-400">
                              {log.ip_address}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: SAAS PLAN DEFINITIONS */}
        {/* ==================================================== */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(SAAS_PLANS).map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Tier Definition
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 mt-1">{plan.name}</h3>
                  <div className="text-2xl font-bold text-neutral-900 mt-2">
                    ${plan.price}
                    <span className="text-xs font-normal text-neutral-500"> / {plan.billingPeriod}</span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{plan.description}</p>

                  <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2 text-xs">
                    <div className="font-semibold text-neutral-800 mb-2">Entitlements & Limits:</div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Max Service Offerings:</span>
                      <strong className="text-neutral-900">{plan.maxServices}</strong>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Max Portfolio Photos:</span>
                      <strong className="text-neutral-900">{plan.maxGalleryItems}</strong>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Custom Subdomain:</span>
                      <strong className="text-emerald-600">Included</strong>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Onboard New Salon Modal */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              Create New Business & Owner Login ID
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              यहाँ जो Login ID और Password आप बनाएँगे, उसी से Business Owner मुख्य पेज पर लॉगिन करेगा।
            </p>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shagun Bridal Studio"
                    value={newTenantName}
                    onChange={(e) => {
                      setNewTenantName(e.target.value);
                      if (!newTenantSlug) {
                        setNewTenantSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '-')
                            .replace(/-+/g, '-')
                            .slice(0, 30)
                        );
                      }
                    }}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Website Link Slug *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="shagun-studio"
                      value={newTenantSlug}
                      onChange={(e) =>
                        setNewTenantSlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg font-mono text-neutral-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Select Website Theme (6 Themes) *</label>
                  <select
                    value={newThemeId}
                    onChange={(e) => setNewThemeId(e.target.value as RoyalThemeId)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-medium"
                  >
                    {ROYAL_THEME_LIST.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name} ({th.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Subscription Plan *</label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  >
                    {Object.values(SAAS_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200">
                <span className="font-bold text-neutral-900 flex items-center gap-1.5 mb-2">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Business Owner Login Credentials (इसी से Owner लॉगिन करेगा)</span>
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Business Owner Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Owner Login ID (Email or Username) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. shagun@salon.com or shagun_owner"
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Owner Password *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shagun@2026"
                        value={newOwnerPassword}
                        onChange={(e) => setNewOwnerPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium text-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Business & Login ID</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Business Owner Login ID & Password Modal */}
      {isEditCredsModalOpen && credTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Edit Business Owner Login ID & Password
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Business: <strong className="text-neutral-800">{credTenant.name}</strong>
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Business Owner Login ID (Email or ID) *
                </label>
                <input
                  type="text"
                  required
                  value={editOwnerLoginId}
                  onChange={(e) => setEditOwnerLoginId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="text"
                  placeholder="Enter new password to reset..."
                  value={editOwnerPassword}
                  onChange={(e) => setEditOwnerPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Assigned Theme</label>
                <select
                  value={editThemeId}
                  onChange={(e) => setEditThemeId(e.target.value as RoyalThemeId)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                >
                  {ROYAL_THEME_LIST.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.name} ({th.badge})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCredsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium text-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Login Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Subscription Renewal Modal */}
      {isRenewModalOpen && renewTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Record Manual Subscription Renewal
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Tenant: <strong className="text-neutral-800">{renewTenant.name}</strong> ({renewTenant.slug}.glamhub.com)
            </p>

            <form onSubmit={handleRecordRenewal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={renewPlanName}
                  onChange={(e) => setRenewPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Amount Collected ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Period (Months) *</label>
                  <select
                    value={renewMonths}
                    onChange={(e) => setRenewMonths(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (Annual)</option>
                    <option value="24">24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Renewal Notes & Verification Audit</label>
                <textarea
                  rows={2}
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="Payment receipt ref, invoice number, or bank wire..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium text-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

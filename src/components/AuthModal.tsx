import React, { useState } from 'react';
import { X, Lock, Shield, Store, AlertCircle, Loader2, CloudCheck } from 'lucide-react';
import { saasApi } from '../services/api.ts';
import { signInWithGooglePopup } from '../firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, tenant: any) => void;
  defaultRole?: 'superadmin' | 'owner';
  activeSlug?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultRole = 'owner',
  activeSlug = 'royal',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await saasApi.login(email, password);
      onLoginSuccess(res.user, res.tenant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        preferredRole: defaultRole,
        targetTenantSlug: activeSlug,
      });
      onLoginSuccess(res.user, res.tenant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Firebase sign-in was cancelled or failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFillDemo = (demoType: 'admin' | 'royal' | 'glamour') => {
    setError(null);
    if (demoType === 'admin') {
      setEmail('admin@glamhub.com');
      setPassword('SuperAdmin2026!');
    } else if (demoType === 'royal') {
      setEmail('owner.royal@glamhub.com');
      setPassword('RoyalPass123!');
    } else if (demoType === 'glamour') {
      setEmail('owner.glamour@glamhub.com');
      setPassword('GlamPass123!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-serif font-bold text-neutral-900">Sign in to GlamHub</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Secured with Google Firebase Authentication & Cloud Firestore.
          </p>
        </div>

        {/* Google Firebase Sign-In Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudCheck className="w-4 h-4" />
            )}
            <span>Continue with Google (Firebase Cloud Auth)</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-neutral-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
            Or Quick Portal Login
          </span>
          <div className="flex-grow border-t border-neutral-200"></div>
        </div>

        {/* 1-Click Demo Fill Shortcuts */}
        <div className="mb-5 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
          <span className="font-semibold text-neutral-700 block mb-2">1-Click Test Credentials:</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="py-1.5 px-2 bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-[11px] font-semibold text-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" />
              <span>Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('royal')}
              className="py-1.5 px-2 bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-[11px] font-semibold text-rose-700 transition-colors flex items-center justify-center gap-1"
            >
              <Store className="w-3 h-3" />
              <span>Royal Owner</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('glamour')}
              className="py-1.5 px-2 bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-[11px] font-semibold text-purple-700 transition-colors flex items-center justify-center gap-1"
            >
              <Store className="w-3 h-3" />
              <span>Glamour Owner</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Sign in to Portal</span>
          </button>
        </form>
      </div>
    </div>
  );
};

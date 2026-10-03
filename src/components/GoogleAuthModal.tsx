import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { GoogleUser, saveUser } from '../services/authService';
import { signInWithGoogleFirebase, saveUserProfileToFirestore } from '../services/firebase';
import { maskEmailIfOwner } from '../services/ownerService';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleUser) => void;
  defaultEmail?: string;
  onUpdateApiKey?: (apiKey: string) => void;
}

const STORAGE_KEY_SETTINGS = 'ais_vibe_settings_clean_v4';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = '',
  onUpdateApiKey,
}) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'account' | 'setup'>('account');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEmail, setShowManualEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userId, setUserId] = useState('');
  const [apiChoice, setApiChoice] = useState<'default' | 'custom'>('default');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('account');
      setEmail(defaultEmail);
      setDisplayName(defaultEmail ? defaultEmail.split('@')[0] : '');
      setShowManualEmail(false);
      setIsProcessing(false);
      setErrorMessage(null);

      // Check if existing custom API key is saved
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.apiKey) {
            setCustomApiKey(parsed.apiKey);
            setApiChoice('custom');
          }
        }
      } catch {}
    }
  }, [isOpen, defaultEmail]);

  if (!isOpen || !mounted) return null;

  // Real Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const fbUser = await signInWithGoogleFirebase();
      if (fbUser) {
        const userEmail = fbUser.email || '';
        const rawName = fbUser.displayName || userEmail.split('@')[0] || 'User';
        const photo = fbUser.photoURL || '';

        setEmail(userEmail);
        setDisplayName(rawName);
        setAvatarUrl(photo);
        setUserId(fbUser.uid);
        setIsProcessing(false);
        setStep('setup');
        return;
      }
    } catch (err: any) {
      console.warn('Google sign-in popup notification:', err.message);
      // If popup is blocked by iframe or browser, smoothly fallback to manual Google email input
      setShowManualEmail(true);
      setErrorMessage('Popup autentikasi dialihkan. Masukkan email Google Anda di bawah:');
    }

    setIsProcessing(false);
  };

  // Manual Google Email Submit
  const handleManualEmailSubmit = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Masukkan alamat email Google yang valid.');
      return;
    }

    let initialName = cleanEmail.split('@')[0];
    initialName = initialName.charAt(0).toUpperCase() + initialName.slice(1);
    setDisplayName(initialName);
    setUserId('usr-' + Math.random().toString(36).slice(2, 9));
    setErrorMessage(null);
    setStep('setup');
  };

  // Finalize setup and connect profile + API
  const handleSaveAndEnter = () => {
    setIsProcessing(true);

    const finalName = displayName.trim() || email.split('@')[0] || 'User';
    const initial = finalName.charAt(0).toUpperCase();
    const finalAvatar =
      avatarUrl ||
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%2327272a"/><text x="50%" y="54%" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;

    const finalApiKey = apiChoice === 'custom' ? customApiKey.trim() : '';

    const user: GoogleUser = {
      id: userId || 'usr-' + Math.random().toString(36).slice(2, 9),
      email: email.trim(),
      name: finalName,
      avatar: finalAvatar,
      loggedInAt: Date.now(),
      apiKey: finalApiKey,
      apiProvider: apiChoice,
    };

    // Save user profile
    saveUser(user);

    // Save API key to StudioSettings storage
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const settings = raw ? JSON.parse(raw) : {};
      settings.apiKey = finalApiKey;
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}

    // Trigger API callback if provided
    if (onUpdateApiKey) {
      onUpdateApiKey(finalApiKey);
    }

    // Persist to Firestore if available
    if (userId && !userId.startsWith('usr-')) {
      saveUserProfileToFirestore(userId, {
        displayName: finalName,
        email: email.trim(),
        avatarUrl: finalAvatar,
      }).catch(() => {});
    }

    setIsProcessing(false);
    onSuccess(user);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={onClose}
      style={{ isolation: 'isolate' }}
    >
      <div
        className="relative w-full max-w-[390px] bg-[#0c0c0e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl text-white flex flex-col space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'account' ? (
          /* ================= STEP 1: LOGIN AS GOOGLE ================= */
          <div className="space-y-5">
            {/* Header Lockup */}
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 mx-auto flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <g transform="rotate(-30 12 12)">
                    <circle cx="7.3" cy="3.2" r="1.45" />
                    <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                    <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                    <circle cx="16.7" cy="20.8" r="1.45" />
                  </g>
                </svg>
              </div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Login with Google
              </h2>
              <p className="text-xs text-white/50 max-w-[280px] mx-auto leading-relaxed">
                Masuk untuk mengakses workspace dan sinkronisasi proyek Anda
              </p>
            </div>

            {/* Error Notice if any */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-amber-300 leading-relaxed text-center">
                {errorMessage}
              </div>
            )}

            {/* Google Login Actions */}
            <div className="space-y-3">
              {/* Primary Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-neutral-100 active:bg-neutral-200 text-black text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Manual Email Fallback Section */}
              {!showManualEmail ? (
                <button
                  type="button"
                  onClick={() => setShowManualEmail(true)}
                  className="w-full text-center text-[11px] text-white/40 hover:text-white/80 py-1 transition-colors"
                >
                  Atau masukkan email secara manual
                </button>
              ) : (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <input
                    type="email"
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email.trim()) {
                        handleManualEmailSubmit();
                      }
                    }}
                    autoFocus
                    className="w-full bg-white/[0.04] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 focus:border-white/40 outline-none placeholder:text-white/25 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowManualEmail(false)}
                      className="flex-1 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-xs font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleManualEmailSubmit}
                      disabled={!email.trim()}
                      className="flex-1 h-9 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= STEP 2: USERNAME & API KEY ================= */
          <div className="space-y-4 animate-fadeIn">
            {/* Header & Account Identity */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-semibold text-xs shrink-0 border border-white/10">
                    {displayName ? displayName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white tracking-tight truncate">
                    Atur Profil & Akses API
                  </div>
                  <div className="text-[11px] text-white/40 font-mono truncate">
                    {email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('account')}
                className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Ganti</span>
              </button>
            </div>

            {/* Field 1: Username / Display Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-white/70 block">
                Username / Nama Tampilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Masukkan username Anda..."
                className="w-full bg-white/[0.04] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 focus:border-white/40 outline-none placeholder:text-white/25 transition-colors"
              />
              <p className="text-[10px] text-white/40">
                Nama ini akan digunakan sebagai identitas pada proyek dan workspace.
              </p>
            </div>

            {/* Field 2: API Key Configuration */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-medium text-white/70 block">
                Koneksi API AI Studio
              </label>

              {/* Clean Segmented Selector */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setApiChoice('default')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    apiChoice === 'default'
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Router Bawaan
                </button>
                <button
                  type="button"
                  onClick={() => setApiChoice('custom')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    apiChoice === 'custom'
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  API Key Kustom
                </button>
              </div>

              {/* Conditional Router Info or Custom Key Input */}
              {apiChoice === 'default' ? (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-white/90 font-medium mb-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terhubung Otomatis</span>
                  </div>
                  Menggunakan router bawaan AI Studio & Clouvia yang sudah terkonfigurasi. Siap pakai tanpa konfigurasi tambahan.
                </div>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Tempel API key pribadi Anda..."
                      className="w-full bg-white/[0.04] text-xs text-white px-3.5 py-2.5 pr-9 rounded-xl border border-white/10 hover:border-white/20 focus:border-white/40 outline-none font-mono placeholder:text-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40">
                    Kunci disimpan secara aman di browser lokal Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAndEnter}
                disabled={isProcessing || !displayName.trim()}
                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-neutral-100 active:bg-neutral-200 text-black text-xs font-semibold flex items-center justify-center transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Masuk ke Workspace</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

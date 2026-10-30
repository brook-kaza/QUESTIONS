'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AdminPinGateProps {
  onSuccess: () => void;
}

export default function AdminPinGate({ onSuccess }: AdminPinGateProps) {
  const [authMethod, setAuthMethod] = useState<'pin' | 'supabase'>('pin');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('mikre_abew_admin_token', data.token);
        }
        sessionStorage.setItem('mikre_abew_admin_session', 'true');
        onSuccess();
        return;
      }

      setError(data.error || 'የተሳሳተ ፒን ኮድ። እባክዎ እንደገና ይሞክሩ።');
      setPin('');
    } catch {
      // Local development or network error fallback
      const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '2223';
      if (pin.trim() === expectedPin.trim()) {
        sessionStorage.setItem('mikre_abew_admin_session', 'true');
        onSuccess();
      } else {
        setError('የተሳሳተ ፒን ኮድ። እባክዎ እንደገና ይሞክሩ።');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      setError('የሱፓቤዝ (Supabase) ቁልፎች ገና አልተገናኙም። እባክዎ በፒን ኮድ (PIN) ይግቡ።');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('የተሳሳተ ኢሜይል ወይም የይለፍ ቃል: ' + authError.message);
      } else if (data.session) {
        sessionStorage.setItem('mikre_abew_admin_session', 'true');
        if (data.session.access_token) {
          sessionStorage.setItem('mikre_abew_admin_token', data.session.access_token);
        }
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'የመግባት ስህተት አጋጥሟል');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200/90 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-700 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            የአዘጋጆች መግቢያ
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            ምክረ አበው — የመድረክና ዳሽቦርድ አስተባባሪዎች ብቻ
          </p>
        </div>

        {/* Tab switch between PIN and Supabase Auth */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('pin');
              setError('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              authMethod === 'pin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            ፈጣን ፒን ኮድ (PIN)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('supabase');
              setError('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              authMethod === 'supabase'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            ሱፓቤዝ መለያ (Supabase Auth)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {authMethod === 'pin' ? (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-pin-input" className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>የአስተባባሪ ፒን ኮድ (PIN)</span>
              </label>
              <input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={pin}
                disabled={isLoading}
                onChange={(e) => setPin(e.target.value)}
                placeholder="ለምሳሌ: 2223"
                autoFocus
                className="w-full text-center tracking-[0.4em] font-mono text-xl sm:text-2xl bg-stone-50 border border-stone-300 text-stone-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
              />
              <p className="mt-2 text-center text-[11px] text-stone-400">
                (መደበኛ ፒን ኮድ: <span className="font-mono font-semibold text-stone-600">2223</span>)
              </p>
            </div>

            <button
              type="submit"
              disabled={!pin || isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                pin && !isLoading
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>እየተረጋገጠ ነው...</span>
                </>
              ) : (
                <>
                  <span>ይግቡ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSupabaseAuth} className="space-y-4">
            <div>
              <label htmlFor="admin-email-input" className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">
                የኢሜይል አድራሻ
              </label>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mikreabew.org"
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
              />
            </div>

            <div>
              <label htmlFor="admin-password-input" className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">
                የይለፍ ቃል
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-xl py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                email && password && !isLoading
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>እየገባ ነው...</span>
                </>
              ) : (
                <span>በሱፓቤዝ ይግቡ</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

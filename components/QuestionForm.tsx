'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CATEGORIES, QuestionCategory } from '@/types/question';
import { submitQuestion } from '@/lib/questions-service';
import { Send, CheckCircle2, AlertCircle, Sparkles, User, MessageSquare, Loader2, ArrowRight, WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function QuestionForm() {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState<QuestionCategory>('ጠቅላላ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const minChars = 10;
  const maxChars = 1000;
  const currentChars = content.trim().length;
  const isFormValid = currentChars >= minChars && currentChars <= maxChars && cooldownSeconds === 0;

  // Track online status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    if (!navigator.onLine) {
      setErrorMessage('የበይነ-መረብ (Internet) ግንኙነት የለም። እባክዎ መስመር ሲመጣ እንደገና ይሞክሩ።');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await submitQuestion({
      content,
      author_name: authorName,
      category,
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      // Set 15-second cooldown to prevent spamming
      setCooldownSeconds(15);
      // Fire festive celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#c58319', '#eab308', '#22c55e', '#3b82f6'],
        });
      } catch {
        // Confetti fallback
      }
    } else {
      setErrorMessage(res.error || 'ጥያቄውን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
    }
  };

  const handleReset = () => {
    setContent('');
    setAuthorName('');
    setCategory('ጠቅላላ');
    setIsSuccess(false);
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Offline banner */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-red-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>የበይነ-መረብ (Internet) ግንኙነት ተቋርጧል።</span>
        </div>
      )}

      {/* Header section */}
      <header className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 mb-3 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>የቀጥታ መድረክ ጥያቄና መልስ</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
          ምክረ አበው - የጥያቄ ማቅረቢያ
        </h1>
        
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          ጥያቄዎች በዝግጅቱ ላይ በቀጥታ በመድረክ መልስ ያገኛሉ።
        </p>
      </header>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-7 relative overflow-hidden transition-all">
        {/* Subtle decorative gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {isSuccess ? (
          /* Success Screen */
          <div className="text-center py-6 sm:py-8 space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                ጥያቄዎ ገብቷል! በመድረክ ይመለሳል።
              </h2>
              <p className="text-stone-600 text-sm max-w-sm mx-auto">
                ጥያቄዎ ለአዘጋጆቹ ደርሷል። በመድረኩ ላይ በተራው መሰረት ለአባቶች ይቀርባል።
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleReset}
                disabled={cooldownSeconds > 0}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm ${
                  cooldownSeconds > 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white cursor-pointer'
                }`}
              >
                <span>
                  {cooldownSeconds > 0
                    ? `ሌላ ጥያቄ ለመላክ ${cooldownSeconds} ሰከንድ ይጠብቁ`
                    : 'ሌላ ጥያቄ ላክ'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="category-select" className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5">
                የጥያቄው ዘርፍ / የሚመለከተው አካል
              </label>
              <div className="relative">
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as QuestionCategory)}
                  className="w-full appearance-none bg-stone-50 hover:bg-stone-100/70 border border-stone-300 text-stone-800 text-sm sm:text-base rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="py-2">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Question Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="question-input" className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>ጥያቄዎ <span className="text-red-500">*</span></span>
                </label>
                <span
                  className={`text-xs font-medium ${
                    currentChars === 0
                      ? 'text-stone-400'
                      : currentChars < minChars || currentChars > maxChars
                      ? 'text-red-500 font-semibold'
                      : 'text-emerald-600'
                  }`}
                >
                  {currentChars < minChars
                    ? `ቢያንስ ${minChars} ፊደላት (${currentChars}/${minChars})`
                    : `${currentChars}/${maxChars} ፊደላት`}
                </span>
              </div>
              <textarea
                id="question-input"
                rows={4}
                required
                maxLength={maxChars}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ጥያቄዎን እዚህ ጋር ይፃፉ..."
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 placeholder:text-stone-400 text-sm sm:text-base rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all resize-y min-h-[110px]"
              />
            </div>

            {/* Optional Author Name */}
            <div>
              <label htmlFor="author-input" className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>ስምዎ <span className="text-stone-400 font-normal">(አማራጭ)</span></span>
              </label>
              <input
                id="author-input"
                type="text"
                maxLength={50}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="ስም (አማራጭ)"
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 placeholder:text-stone-400 text-sm sm:text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
              />
              <p className="mt-1 text-[11px] sm:text-xs text-stone-500">
                ባዶ ከሆኑ በራስ-ሰር &quot;አይታወቅም&quot; ተብሎ በምስጢር ይቀርባል።
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all duration-150 select-none ${
                isFormValid && !isSubmitting
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white cursor-pointer hover:shadow'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>እየላከ ነው...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ጥያቄ ላክ</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer navigation & organizer link */}
      <footer className="mt-8 text-center text-xs text-stone-500 space-y-2">
        <p>
          ምክረ አበው — ሁሉም መብቶች የተጠበቁ ናቸው
        </p>
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-stone-600 hover:text-amber-700 font-medium transition-colors underline decoration-dotted underline-offset-4"
          >
            <span>የአስተባባሪዎች እና የመድረክ ዳሽቦርድ (Admin)</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

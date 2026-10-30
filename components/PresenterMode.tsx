'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types/question';
import {
  Maximize2,
  Minimize2,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
  Tag,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatAmharicTime } from '@/lib/date-utils';

interface PresenterModeProps {
  questions: Question[];
  onClose: () => void;
  onToggleAnswered: (id: string, current: boolean) => void;
  onToggleStarred: (id: string, current: boolean) => void;
  initialIndex?: number;
}

export default function PresenterMode({
  questions,
  onClose,
  onToggleAnswered,
  onToggleStarred,
  initialIndex = 0,
}: PresenterModeProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, questions.length - 1))
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync index if questions change
  useEffect(() => {
    if (currentIndex >= questions.length && questions.length > 0) {
      setCurrentIndex(questions.length - 1);
    }
  }, [questions.length, currentIndex]);

  const currentQuestion = questions[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 's' && currentQuestion) {
        e.preventDefault();
        onToggleStarred(currentQuestion.id, currentQuestion.is_starred);
      } else if ((e.key.toLowerCase() === 'a' || e.code === 'Space') && currentQuestion) {
        e.preventDefault();
        onToggleAnswered(currentQuestion.id, currentQuestion.is_answered);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose, currentQuestion, onToggleStarred, onToggleAnswered]);

  return (
    <div className="fixed inset-0 z-50 bg-[#090a0f] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top Stage Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#0d0f15]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>የመድረክ አቀራረብ ሁነታ</span>
          </div>
          <span className="text-stone-400 text-sm hidden md:inline">
            ምክረ አበው — የቀጥታ መድረክ ማሳያ
          </span>
        </div>

        {/* Center counter */}
        {questions.length > 0 && (
          <div className="text-center font-bold text-stone-300 text-sm sm:text-base">
            ጥያቄ <span className="text-amber-400 text-lg">{currentIndex + 1}</span> ከ{' '}
            <span className="text-stone-400">{questions.length}</span>
          </div>
        )}

        {/* Right Stage Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            title="ሙሉ ስክሪን"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>ውጣ</span>
          </button>
        </div>
      </div>

      {/* Main Question Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-5xl mx-auto w-full text-center overflow-y-auto">
        {questions.length === 0 ? (
          <div className="text-stone-400 text-center py-12 space-y-3">
            <p className="text-xl sm:text-2xl font-bold">ምንም ጥያቄ አልተገኘም</p>
            <p className="text-sm text-stone-500">
              ተሳታፊዎች ጥያቄ ሲልኩ እዚህ ጋር በራስ-ሰር ይወጣል።
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Meta Tags: Category, Author, Time */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full text-sm sm:text-base font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>{currentQuestion.category}</span>
              </span>

              <span className="px-4 py-1.5 rounded-full text-sm sm:text-base font-medium bg-stone-800 text-stone-300 border border-stone-700 inline-flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400" />
                <span>ከ: {currentQuestion.author_name || 'አይታወቅም'}</span>
              </span>

              <span className="text-xs sm:text-sm text-stone-400 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>{formatAmharicTime(currentQuestion.created_at)}</span>
              </span>

              {currentQuestion.is_starred && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-stone-950 inline-flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>ቅድሚያ ተሰጥቶታል</span>
                </span>
              )}

              {currentQuestion.is_answered && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-stone-950 inline-flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>መልስ አግኝቷል</span>
                </span>
              )}
            </div>

            {/* Huge Readable Text */}
            <div className="py-4 sm:py-6">
              <blockquote
                className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.35] tracking-tight text-stone-100 max-w-4xl mx-auto break-words ${
                  currentQuestion.is_answered
                    ? 'line-through text-stone-500 decoration-stone-600'
                    : ''
                }`}
              >
                &ldquo;{currentQuestion.content}&rdquo;
              </blockquote>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stage Action Toolbar */}
      <div className="p-4 sm:p-6 border-t border-stone-800 bg-[#0d0f15]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick shortcuts info */}
          <div className="text-xs text-stone-500 hidden lg:block">
            አቋራጮች: <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-300">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-300">→</kbd> መቀያየሪያ |{' '}
            <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-300">S</kbd> ኮከብ |{' '}
            <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-300">Space</kbd> መልስ
          </div>

          {/* Action buttons on stage */}
          {currentQuestion && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onToggleStarred(currentQuestion.id, currentQuestion.is_starred)
                }
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  currentQuestion.is_starred
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                <Star
                  className={`w-4 h-4 ${
                    currentQuestion.is_starred ? 'fill-current' : ''
                  }`}
                />
                <span>{currentQuestion.is_starred ? 'ኮከብ አለው' : 'ኮከብ አድርግ'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggleAnswered(currentQuestion.id, currentQuestion.is_answered)
                }
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  currentQuestion.is_answered
                    ? 'bg-emerald-500 text-stone-950 shadow-md'
                    : 'bg-stone-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-stone-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {currentQuestion.is_answered ? 'ተመልሷል' : 'መልስ ተሰጥቷል በል'}
                </span>
              </button>
            </div>
          )}

          {/* Navigation Prev / Next */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={handlePrev}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                currentIndex > 0
                  ? 'bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-white shadow-sm'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>ቀዳሚ ጥያቄ</span>
            </button>

            <button
              type="button"
              disabled={currentIndex >= questions.length - 1}
              onClick={handleNext}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                currentIndex < questions.length - 1
                  ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-sm'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
              }`}
            >
              <span>ቀጣይ ጥያቄ</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Question, FilterTab, CATEGORIES } from '@/types/question';
import {
  fetchQuestions,
  toggleQuestionAnswered,
  toggleQuestionStarred,
  deleteQuestion,
} from '@/lib/questions-service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { playNotificationChime } from '@/lib/audio-chime';
import QuestionCard from './QuestionCard';
import PresenterMode from './PresenterMode';
import {
  Tv,
  Volume2,
  VolumeX,
  Search,
  LogOut,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Star,
  CheckCircle,
  HelpCircle,
  Clock,
  Filter,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Load initial questions
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchQuestions();
    setQuestions(data);
    setIsLoading(false);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      loadData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsLiveConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  useEffect(() => {
    loadData();
    setIsSupabaseReady(isSupabaseConfigured());
  }, [loadData]);

  // Set up Supabase Realtime channel + BroadcastChannel fallback
  useEffect(() => {
    let cleanupSupabase: (() => void) | null = null;
    let broadcastChannel: BroadcastChannel | null = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const channel = supabase
          .channel('questions-realtime-dashboard')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'questions' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newRow = payload.new as Question;
                setQuestions((prev) => [newRow, ...prev.filter((q) => q.id !== newRow.id)]);
                setNewlyAddedId(newRow.id);
                setTimeout(() => setNewlyAddedId(null), 4000);
                if (soundEnabled) playNotificationChime();
              } else if (payload.eventType === 'UPDATE') {
                const updatedRow = payload.new as Question;
                setQuestions((prev) =>
                  prev.map((q) => (q.id === updatedRow.id ? updatedRow : q))
                );
              } else if (payload.eventType === 'DELETE') {
                const oldRow = payload.old as { id: string };
                setQuestions((prev) => prev.filter((q) => q.id !== oldRow.id));
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsLiveConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsLiveConnected(false);
            }
          });

        cleanupSupabase = () => {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        };
      } catch (err) {
        console.error('Realtime subscription error:', err);
      }
    } else {
      // Offline/Demo BroadcastChannel sync between tabs
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('mikre_abew_broadcast');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'sync' && Array.isArray(event.data?.questions)) {
            setQuestions(event.data.questions);
            if (soundEnabled) playNotificationChime();
          }
        };
        setIsLiveConnected(true);
      }
    }

    return () => {
      if (cleanupSupabase) cleanupSupabase();
      if (broadcastChannel) broadcastChannel.close();
    };
  }, [soundEnabled]);

  // Actions
  const handleToggleAnswered = async (id: string, current: boolean) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_answered: !current } : q))
    );
    await toggleQuestionAnswered(id, current);
  };

  const handleToggleStarred = async (id: string, current: boolean) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_starred: !current } : q))
    );
    await toggleQuestionStarred(id, current);
  };

  const handleDelete = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    await deleteQuestion(id);
  };

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Tab filter
      if (activeTab === 'unread' && q.is_answered) return false;
      if (activeTab === 'starred' && !q.is_starred) return false;
      if (activeTab === 'answered' && !q.is_answered) return false;

      // Category filter
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const contentMatch = q.content.toLowerCase().includes(query);
        const authorMatch = q.author_name?.toLowerCase().includes(query);
        return contentMatch || authorMatch;
      }

      return true;
    });
  }, [questions, activeTab, selectedCategory, searchQuery]);

  // Priority sorting: Starred questions first (if not answered), then newest
  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      if (a.is_starred !== b.is_starred) {
        return a.is_starred ? -1 : 1;
      }
      if (a.is_answered !== b.is_answered) {
        return a.is_answered ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredQuestions]);

  // Counts for tabs & stats
  const stats = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter((q) => q.is_answered).length;
    const starred = questions.filter((q) => q.is_starred).length;
    const unread = questions.filter((q) => !q.is_answered).length;
    return { total, answered, starred, unread };
  }, [questions]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 pb-16">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Live status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              ም
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>ምክረ አበው</span>
                <span className="text-stone-400 font-normal text-xs sm:text-sm hidden sm:inline">
                  | የአስተባባሪዎች ዳሽቦርድ
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
                    <span>{isLiveConnected ? 'ቀጥታ ስርጭት በርቷል' : 'የቀጥታ ግንኙነት በመጠባበቅ ላይ'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>ከመስመር ውጭ (Offline)</span>
                  </span>
                )}
                {!isSupabaseReady && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    የሙከራ ሁነታ (Demo Mode)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-stone-100 border-stone-200 text-stone-500'
              }`}
              title={soundEnabled ? 'ድምፅ ማሳወቂያ አጥፋ' : 'ድምፅ ማሳወቂያ አብራ'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span className="hidden md:inline">ድምፅ በርቷል</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden md:inline">ድምፅ ጠፍቷል</span>
                </>
              )}
            </button>

            {/* Presenter Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresenterMode(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>የመድረክ አቀራረብ ሁነታ</span>
            </button>

            {/* Public view link */}
            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
              title="የጥያቄ ማቅረቢያውን ገጽ ይመልከቱ"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 hover:text-red-600 text-stone-500 transition-colors cursor-pointer"
              title="ውጣ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Supabase connection guide banner if not configured */}
        {!isSupabaseReady && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">የሱፓቤዝ (Supabase) ዳታቤዝ ማስተሳሰሪያ:</p>
                <p className="text-amber-800/90 mt-0.5">
                  በአሁኑ ሰዓት መተግበሪያው በሙከራ ሁነታ (Demo) እየሰራ ነው። በቀጥታ ከሱፓቤዝ ጋር ለማገናኘት{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{' '}
                  እና{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{' '}
                  በ .env.local ውስጥ ይሙሉ እንዲሁም{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">
                    supabase/schema.sql
                  </code>{' '}
                  በሱፓቤዝ SQL Editor ያሂዱ።
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="self-start md:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ዳታ አድስ</span>
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500 block mb-1">
              ጠቅላላ ጥያቄዎች
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.total}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-amber-700 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>ያልተመለሱ (አዳዲስ)</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.unread}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-amber-800 block mb-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>ኮከብ የተደረጉ</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {stats.starred}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-emerald-700 block mb-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>መልስ ያገኙ</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.answered}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 mb-6 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ሁሉም ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ያነበቡት / ያልተመለሱ ({stats.unread})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('starred')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'starred'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ኮከብ የተደረገባቸው ({stats.starred})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('answered')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'answered'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                መልስ የተሰጠባቸው ({stats.answered})
              </button>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={loadData}
              className="self-end lg:self-auto p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              title="እንደገና ጫን"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ጥያቄዎችን ወይም የጠያቂውን ስም ይፈልጉ..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium cursor-pointer"
              >
                <option value="all">ሁሉም ዘርፎች (All)</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
            <p className="text-stone-500 text-sm">ጥያቄዎች እየተጫኑ ነው...</p>
          </div>
        ) : sortedQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">ምንም ጥያቄ አልተገኘም</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
              በተመረጠው ማጣሪያ መሰረት የሚታይ ጥያቄ የለም። ተሳታፊዎች ጥያቄ ሲያቀርቡ በገጹ ላይ በቅጽበት ይወጣል።
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                isNew={q.id === newlyAddedId}
                onToggleAnswered={handleToggleAnswered}
                onToggleStarred={handleToggleStarred}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Presenter Mode Modal */}
      {isPresenterMode && (
        <PresenterMode
          questions={sortedQuestions}
          onClose={() => setIsPresenterMode(false)}
          onToggleAnswered={handleToggleAnswered}
          onToggleStarred={handleToggleStarred}
        />
      )}
    </div>
  );
}

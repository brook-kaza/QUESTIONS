import { supabase, isSupabaseConfigured } from './supabase';
import { Question, QuestionCategory } from '@/types/question';
import { INITIAL_SAMPLE_QUESTIONS } from './sample-data';

const LOCAL_STORAGE_KEY = 'mikre_abew_questions_demo';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('mikre_abew_admin_token') || null;
}

// Helper to get local fallback questions
function getLocalQuestions(): Question[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_QUESTIONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_QUESTIONS));
      return INITIAL_SAMPLE_QUESTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_QUESTIONS;
  }
}

function saveLocalQuestions(questions: Question[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
    // Broadcast for multi-tab sync in demo mode
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('mikre_abew_broadcast');
      channel.postMessage({ type: 'sync', questions });
      channel.close();
    }
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export async function submitQuestion(payload: {
  content: string;
  author_name?: string;
  category: QuestionCategory | string;
}): Promise<{ success: boolean; data?: Question; error?: string }> {
  const content = payload.content.trim();
  const author_name = payload.author_name?.trim() || 'አይታወቅም';
  const category = payload.category || 'ጠቅላላ';

  if (content.length < 10) {
    return { success: false, error: 'እባክዎ ቢያንስ 10 ፊደላት የያዘ ጥያቄ ይፃፉ።' };
  }

  // First attempt via secure Server API route (provides rate limiting & server validation)
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author_name, category }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      if (json.demo) {
        // Fallback demo sync
        const current = getLocalQuestions();
        saveLocalQuestions([json.data, ...current]);
      }
      return { success: true, data: json.data as Question };
    }

    if (!res.ok && json.error) {
      return { success: false, error: json.error };
    }
  } catch (apiErr) {
    console.warn('API endpoint unreachable, trying client fallback...', apiErr);
  }

  // Fallback direct to Supabase client if API route was unreachable
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{ content, author_name, category }])
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as Question };
      }
    } catch (sbErr) {
      console.error('Direct Supabase insert error:', sbErr);
    }
  }

  // Local storage demo fallback
  const newQuestion: Question = {
    id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    content,
    author_name,
    category,
    is_answered: false,
    is_starred: false,
    created_at: new Date().toISOString(),
  };

  const current = getLocalQuestions();
  saveLocalQuestions([newQuestion, ...current]);
  return { success: true, data: newQuestion };
}

export async function fetchQuestions(): Promise<{ data: Question[]; error?: string }> {
  const token = getAdminToken();

  // Try secure server API first if admin token is present
  if (token) {
    try {
      const res = await fetch('/api/admin/questions', {
        headers: {
          'x-admin-token': token,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return { data: json.data };
        }
      }
    } catch (err) {
      console.warn('Admin API fetch failed, trying direct Supabase client...', err);
    }
  }

  // Direct Supabase client fetch
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('is_starred', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return { data: data as Question[] };
      }
    } catch (err: any) {
      console.warn('Direct fetch error:', err);
    }
  }

  return { data: getLocalQuestions() };
}

export async function toggleQuestionAnswered(id: string, currentStatus: boolean): Promise<boolean> {
  const nextStatus = !currentStatus;
  const token = getAdminToken();

  // Try server API first
  if (token) {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ id, is_answered: nextStatus }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Server patch failed:', err);
    }
  }

  // Direct Supabase update
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_answered: nextStatus })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.error(err);
    }
  }

  // Local fallback
  const list = getLocalQuestions();
  const updated = list.map((q) => (q.id === id ? { ...q, is_answered: nextStatus } : q));
  saveLocalQuestions(updated);
  return true;
}

export async function toggleQuestionStarred(id: string, currentStatus: boolean): Promise<boolean> {
  const nextStatus = !currentStatus;
  const token = getAdminToken();

  // Try server API first
  if (token) {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ id, is_starred: nextStatus }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Server patch failed:', err);
    }
  }

  // Direct Supabase update
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_starred: nextStatus })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.error(err);
    }
  }

  // Local fallback
  const list = getLocalQuestions();
  const updated = list.map((q) => (q.id === id ? { ...q, is_starred: nextStatus } : q));
  saveLocalQuestions(updated);
  return true;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const token = getAdminToken();

  // Try server API first
  if (token) {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Server delete failed:', err);
    }
  }

  // Direct Supabase delete
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.error(err);
    }
  }

  // Local fallback
  const list = getLocalQuestions();
  const updated = list.filter((q) => q.id !== id);
  saveLocalQuestions(updated);
  return true;
}

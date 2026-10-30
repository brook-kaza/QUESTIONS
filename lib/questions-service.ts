import { supabase, isSupabaseConfigured } from './supabase';
import { Question, QuestionCategory } from '@/types/question';
import { INITIAL_SAMPLE_QUESTIONS } from './sample-data';

const LOCAL_STORAGE_KEY = 'mikre_abew_questions_demo';

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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            content,
            author_name,
            category,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Question };
    } catch (err: any) {
      return { success: false, error: err?.message || 'ያልታወቀ ስህተት አጋጥሟል' };
    }
  }

  // Fallback local storage demo mode
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
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('is_starred', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, fallback to local:', error);
        return { data: getLocalQuestions(), error: error.message };
      }

      return { data: (data as Question[]) || [] };
    } catch (err: any) {
      console.warn('Supabase fetch exception, fallback to local:', err);
      return { data: getLocalQuestions(), error: err?.message };
    }
  }

  return { data: getLocalQuestions() };
}

export async function toggleQuestionAnswered(id: string, currentStatus: boolean): Promise<boolean> {
  const nextStatus = !currentStatus;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_answered: nextStatus })
        .eq('id', id);

      if (error) {
        console.error('Error toggling answered in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const list = getLocalQuestions();
  const updated = list.map((q) => (q.id === id ? { ...q, is_answered: nextStatus } : q));
  saveLocalQuestions(updated);
  return true;
}

export async function toggleQuestionStarred(id: string, currentStatus: boolean): Promise<boolean> {
  const nextStatus = !currentStatus;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_starred: nextStatus })
        .eq('id', id);

      if (error) {
        console.error('Error toggling starred in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const list = getLocalQuestions();
  const updated = list.map((q) => (q.id === id ? { ...q, is_starred: nextStatus } : q));
  saveLocalQuestions(updated);
  return true;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) {
        console.error('Error deleting question in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const list = getLocalQuestions();
  const updated = list.filter((q) => q.id !== id);
  saveLocalQuestions(updated);
  return true;
}


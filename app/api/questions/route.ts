import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory rate limiting map for question submissions (IP -> timestamps)
const submissionRateMap = new Map<string, number[]>();

const ALLOWED_CATEGORIES = new Set(['ጠቅላላ', 'ለአባቶች', 'ለወጣቶች', 'ለቤተሰብ']);

function sanitizeText(str: string): string {
  return str
    .replace(/[<>]/g, '') // Strip angle brackets to prevent HTML injection
    .trim();
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // If service role key is available on server, use it; otherwise anon key
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder') || !url.startsWith('https://')) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client';
    const now = Date.now();

    // Rate Limiting: Max 4 submissions per 60 seconds per IP
    const timestamps = (submissionRateMap.get(ip) || []).filter((t) => now - t < 60000);
    if (timestamps.length >= 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'ጥያቄዎችን በብዛት ልከዋል። እባክዎ 1 ደቂቃ ጠብቀው እንደገና ይሞክሩ።',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    let rawContent = typeof body.content === 'string' ? body.content : '';
    let rawAuthor = typeof body.author_name === 'string' ? body.author_name : '';
    let rawCategory = typeof body.category === 'string' ? body.category : 'ጠቅላላ';

    const content = sanitizeText(rawContent);
    const author_name = sanitizeText(rawAuthor).slice(0, 50) || 'አይታወቅም';
    const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'ጠቅላላ';

    // Strict validation
    if (content.length < 10) {
      return NextResponse.json(
        { success: false, error: 'ጥያቄው ቢያንስ 10 ፊደላት መሆን አለበት።' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'ጥያቄው ከ 1000 ፊደላት መብለጥ የለበትም።' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
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
        console.error('Supabase server insert error:', error);
        return NextResponse.json(
          { success: false, error: 'ጥያቄውን መመዝገብ አልተቻለም: ' + error.message },
          { status: 500 }
        );
      }

      // Record successful submission for rate limit
      timestamps.push(now);
      submissionRateMap.set(ip, timestamps);

      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    // If Supabase not yet configured, allow local demo mode acknowledgment
    timestamps.push(now);
    submissionRateMap.set(ip, timestamps);

    return NextResponse.json({
      success: true,
      demo: true,
      data: {
        id: 'local-' + Date.now(),
        content,
        author_name,
        category,
        is_answered: false,
        is_starred: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('API Error in /api/questions:', err);
    return NextResponse.json(
      { success: false, error: 'ያልተጠበቀ የስርዓት ስህተት አጋጥሟል' },
      { status: 500 }
    );
  }
}


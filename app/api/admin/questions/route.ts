import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function isValidAdmin(req: NextRequest): boolean {
  // Check cookie or authorization header
  const cookieToken = req.cookies.get('admin_session')?.value;
  const headerToken = req.headers.get('x-admin-token');
  const token = headerToken || cookieToken;

  if (!token) {
    // Check fallback header for development / quick PIN
    const directPin = req.headers.get('x-admin-pin');
    const expected =
      process.env.ADMIN_PIN?.trim() ||
      process.env.NEXT_PUBLIC_ADMIN_PIN?.trim() ||
      '1234';
    if (directPin && directPin === expected) return true;
    return false;
  }

  // Token format: timestamp.signature
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  const now = Date.now();

  // Expire after 12 hours
  if (isNaN(timestamp) || now - timestamp > 1000 * 60 * 60 * 12) {
    return false;
  }

  const expectedPin =
    process.env.ADMIN_PIN?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_PIN?.trim() ||
    '1234';
  const secret = process.env.ADMIN_SECRET || expectedPin + '-session-secret-salt';

  const expectedSig1 = crypto
    .createHmac('sha256', secret)
    .update(`unknown-client:${timestamp}`)
    .digest('hex');

  // Also verify against request ip
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client';
  const expectedSig2 = crypto
    .createHmac('sha256', secret)
    .update(`${ip}:${timestamp}`)
    .digest('hex');

  return signature === expectedSig1 || signature === expectedSig2;
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

// GET all questions for admin
export async function GET(req: NextRequest) {
  if (!isValidAdmin(req)) {
    return NextResponse.json({ success: false, error: 'ያልተፈቀደ መዳረሻ (Unauthorized)' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('is_starred', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// PATCH update status (answered / starred)
export async function PATCH(req: NextRequest) {
  if (!isValidAdmin(req)) {
    return NextResponse.json({ success: false, error: 'ያልተፈቀደ መዳረሻ' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true });
  }

  try {
    const { id, is_answered, is_starred } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'የጥያቄው መለያ (ID) ያስፈልጋል' }, { status: 400 });
    }

    const updates: Record<string, boolean> = {};
    if (typeof is_answered === 'boolean') updates.is_answered = is_answered;
    if (typeof is_starred === 'boolean') updates.is_starred = is_starred;

    const { error } = await supabase.from('questions').update(updates).eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// DELETE a question
export async function DELETE(req: NextRequest) {
  if (!isValidAdmin(req)) {
    return NextResponse.json({ success: false, error: 'ያልተፈቀደ መዳረሻ' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'የጥያቄው መለያ ያስፈልጋል' }, { status: 400 });
    }

    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}


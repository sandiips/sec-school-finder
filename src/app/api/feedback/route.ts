import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Route segment config - prevents build-time module evaluation in Next.js 15.4.10+
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  path?: string;
  userAgent?: string;
  email?: string;
  rating?: number;            // 1..5
  category?: 'Bug' | 'Confusing' | 'Idea' | 'Other';
  message: string;
  context?: Record<string, any>;
};

export async function POST(req: Request) {
  // Create Supabase client at runtime to avoid build-time initialization errors
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase configuration missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const body: Body = await req.json();

    if (!body?.message || body.message.trim().length < 2) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Basic sanitation / clamping
    const rating =
      typeof body.rating === 'number'
        ? Math.max(1, Math.min(5, Math.floor(body.rating)))
        : null;

    const { error } = await supabase.from('feedback').insert({
      path: body.path ?? null,
      user_agent: body.userAgent ?? null,
      email: body.email ?? null,
      rating,
      category: body.category ?? 'Other',
      message: body.message.trim(),
      context: body.context ?? null
    });

    if (error) {
      console.error('Feedback insert failed:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

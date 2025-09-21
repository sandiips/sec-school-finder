import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

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

    const { error } = await supabaseAdmin.from('feedback').insert({
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

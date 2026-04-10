import { NextRequest, NextResponse } from 'next/server';

const BOT_SERVER = process.env.NEXT_PUBLIC_BOT_SERVER_URL ?? 'http://localhost:7860';

/** Proxy GET /api/call-records → bot server /call-records */
export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${BOT_SERVER}/call-records`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ recordings: [] }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ recordings: [] });
  }
}

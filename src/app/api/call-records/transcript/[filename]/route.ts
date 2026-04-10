import { NextRequest, NextResponse } from 'next/server';

const BOT_SERVER = process.env.NEXT_PUBLIC_BOT_SERVER_URL ?? 'http://localhost:7860';

/** Proxy transcript JSON from bot server */
export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const res = await fetch(`${BOT_SERVER}/call-records/transcript/${params.filename}`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json([], { status: 404 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

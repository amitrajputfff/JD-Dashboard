import { NextRequest, NextResponse } from 'next/server';

const BOT_SERVER = process.env.NEXT_PUBLIC_BOT_SERVER_URL ?? 'http://localhost:7860';

/** Proxy audio files from bot server */
export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const res = await fetch(`${BOT_SERVER}/call-records/audio/${params.filename}`, { cache: 'no-store' });
    if (!res.ok) return new NextResponse(null, { status: 404 });
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `inline; filename="${params.filename}"`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

/**
 * Proxy WebRTC offer/answer to the bot server (server.py running on port 7860).
 *
 * The frontend WebRTC client posts to /api/offer (same origin).
 * This route forwards the full body — including assistant_id and query_params —
 * to the bot server and streams the SDP answer back.
 */

import { NextRequest, NextResponse } from "next/server";

const BOT_SERVER_URL = process.env.BOT_SERVER_URL ?? "http://localhost:7860";

async function proxy(req: NextRequest, method: string): Promise<NextResponse> {
  const body = method !== "GET" ? await req.text() : undefined;

  try {
    const res = await fetch(`${BOT_SERVER_URL}/api/offer`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/offer] Bot server unreachable:", err);
    return NextResponse.json(
      { error: "Bot server unavailable. Make sure server.py is running on port 7860." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  return proxy(req, "POST");
}

// ICE candidate trickle (PATCH /api/offer)
export async function PATCH(req: NextRequest) {
  return proxy(req, "PATCH");
}

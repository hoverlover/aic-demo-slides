import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function POST() {
  // Generate a random 4-digit code
  let code: string;
  let attempts = 0;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await kv.get(`room:${code}`);
    if (!existing) break;
    attempts++;
  } while (attempts < 20);

  const state = { current: 1, total: 1, lastAction: "init" };
  // Store with 1-hour TTL (3600 seconds)
  await kv.set(`room:${code}`, JSON.stringify(state), { ex: 3600 });

  return NextResponse.json({ room: code, ...state });
}

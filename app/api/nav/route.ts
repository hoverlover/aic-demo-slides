import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, action, slide, total } = body as {
    room: string;
    action: "next" | "prev" | "goto";
    slide?: number;
    total?: number;
  };

  if (!room || !action) {
    return NextResponse.json({ error: "room and action required" }, { status: 400 });
  }

  const raw = await kv.get(`room:${room}`);
  if (!raw) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const state = typeof raw === "string" ? JSON.parse(raw) : raw;

  // Update total if provided
  if (total !== undefined) {
    state.total = total;
  }

  if (action === "next") {
    if (state.current < state.total) state.current++;
  } else if (action === "prev") {
    if (state.current > 1) state.current--;
  } else if (action === "goto" && slide !== undefined) {
    state.current = Math.max(1, Math.min(slide, state.total));
  }

  state.lastAction = action;

  // Refresh TTL on each nav action
  await kv.set(`room:${room}`, JSON.stringify(state), { ex: 3600 });

  return NextResponse.json(state);
}

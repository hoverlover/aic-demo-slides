import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");

  if (!room) {
    return NextResponse.json({ error: "room query param required" }, { status: 400 });
  }

  const raw = await kv.get(`room:${room}`);
  if (!raw) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const state = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json(state);
}

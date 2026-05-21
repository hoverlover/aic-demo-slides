import { NextRequest, NextResponse } from "next/server";

import {
  canUseRoomStore,
  getRoom,
  roomStoreFailureResponse,
  roomStoreUnavailableResponse,
} from "../room-store";

export async function GET(req: NextRequest) {
  if (!canUseRoomStore()) {
    return NextResponse.json(roomStoreUnavailableResponse(), { status: 503 });
  }

  const room = req.nextUrl.searchParams.get("room");

  if (!room) {
    return NextResponse.json({ error: "room query param required" }, { status: 400 });
  }

  try {
    const state = await getRoom(room);
    if (!state) {
      return NextResponse.json({ error: "room not found" }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(roomStoreFailureResponse(error), { status: 502 });
  }
}

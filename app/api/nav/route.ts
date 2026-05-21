import { NextRequest, NextResponse } from "next/server";

import {
  canUseRoomStore,
  getRoom,
  roomStoreFailureResponse,
  roomStoreUnavailableResponse,
  setRoom,
} from "../room-store";

export async function POST(req: NextRequest) {
  if (!canUseRoomStore()) {
    return NextResponse.json(roomStoreUnavailableResponse(), { status: 503 });
  }

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

  try {
    const state = await getRoom(room);
    if (!state) {
      return NextResponse.json({ error: "room not found" }, { status: 404 });
    }

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
    await setRoom(room, state);

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(roomStoreFailureResponse(error), { status: 502 });
  }
}

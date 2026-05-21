import { NextResponse } from "next/server";

import {
  type RoomState,
  canUseRoomStore,
  getRoom,
  roomStoreFailureResponse,
  roomStoreUnavailableResponse,
  setRoom,
} from "../room-store";

export async function POST() {
  if (!canUseRoomStore()) {
    return NextResponse.json(roomStoreUnavailableResponse(), { status: 503 });
  }

  // Generate a random 4-digit code
  let code: string;
  let attempts = 0;

  try {
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
      const existing = await getRoom(code);
      if (!existing) break;
      attempts++;
    } while (attempts < 20);

    const state: RoomState = { current: 1, total: 1, lastAction: "init" };
    // Store with 1-hour TTL (3600 seconds)
    await setRoom(code, state);

    return NextResponse.json({ room: code, ...state });
  } catch (error) {
    return NextResponse.json(roomStoreFailureResponse(error), { status: 502 });
  }
}

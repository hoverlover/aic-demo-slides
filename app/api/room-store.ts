import { createClient } from "@vercel/kv";

export type RoomState = {
  current: number;
  total: number;
  lastAction: "init" | "next" | "prev" | "goto";
};

const ROOM_TTL_SECONDS = 3600;
const ROOM_TTL_MS = ROOM_TTL_SECONDS * 1000;

type MemoryRoom = {
  state: RoomState;
  expiresAt: number;
};

type RoomStoreGlobal = typeof globalThis & {
  __slideDeckRooms?: Map<string, MemoryRoom>;
};

const globalForRooms = globalThis as RoomStoreGlobal;
const memoryRooms = globalForRooms.__slideDeckRooms ?? new Map<string, MemoryRoom>();
globalForRooms.__slideDeckRooms = memoryRooms;
let remoteClient: ReturnType<typeof createClient> | null = null;
let remoteClientKey = "";

export function canUseRoomStore() {
  return Boolean(getRemoteConfig()) || process.env.NODE_ENV !== "production";
}

export function roomStoreUnavailableResponse() {
  return {
    error: "remote room storage unavailable",
    detail:
      "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or legacy KV_REST_API_URL and KV_REST_API_TOKEN, for production remote control.",
  };
}

export function roomStoreFailureResponse(error: unknown) {
  console.error("Remote room store error", error);

  return {
    error: "remote room storage failed",
    detail: "Could not reach the configured Upstash Redis REST endpoint.",
  };
}

export async function getRoom(room: string) {
  const remote = getRemoteClient();
  if (remote) {
    const raw = await remote.get<RoomState | string>(roomKey(room));
    return parseRoomState(raw);
  }

  ensureLocalFallbackAllowed();
  pruneExpiredMemoryRooms();

  const entry = memoryRooms.get(room);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    memoryRooms.delete(room);
    return null;
  }

  return { ...entry.state };
}

export async function setRoom(room: string, state: RoomState) {
  const remote = getRemoteClient();
  if (remote) {
    await remote.set(roomKey(room), JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    return;
  }

  ensureLocalFallbackAllowed();
  pruneExpiredMemoryRooms();
  memoryRooms.set(room, {
    state: { ...state },
    expiresAt: Date.now() + ROOM_TTL_MS,
  });
}

function getRemoteClient() {
  const config = getRemoteConfig();
  if (!config) {
    return null;
  }

  const clientKey = `${config.url}:${config.token}`;
  if (!remoteClient || remoteClientKey !== clientKey) {
    remoteClient = createClient(config);
    remoteClientKey = clientKey;
  }

  return remoteClient;
}

function getRemoteConfig() {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    return { url: upstashUrl, token: upstashToken };
  }

  const legacyUrl = process.env.KV_REST_API_URL;
  const legacyToken = process.env.KV_REST_API_TOKEN;

  if (legacyUrl && legacyToken) {
    return { url: legacyUrl, token: legacyToken };
  }

  return null;
}

function ensureLocalFallbackAllowed() {
  if (!canUseRoomStore()) {
    throw new Error(roomStoreUnavailableResponse().detail);
  }
}

function parseRoomState(raw: RoomState | string | null) {
  if (!raw) {
    return null;
  }

  if (typeof raw === "string") {
    return JSON.parse(raw) as RoomState;
  }

  return raw;
}

function pruneExpiredMemoryRooms() {
  const now = Date.now();

  for (const [room, entry] of memoryRooms) {
    if (entry.expiresAt <= now) {
      memoryRooms.delete(room);
    }
  }
}

function roomKey(room: string) {
  return `room:${room}`;
}

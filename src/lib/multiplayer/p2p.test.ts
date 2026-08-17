import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultIceServers } from "./p2p";

const FALLBACK = ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("defaultIceServers", () => {
  it("falls back to Google + Cloudflare STUN when VITE_STUN_URLS is unset", () => {
    vi.stubEnv("VITE_STUN_URLS", undefined);
    const servers = defaultIceServers();
    expect(servers).toHaveLength(1);
    expect(servers[0].urls).toEqual(FALLBACK);
  });

  it("uses VITE_STUN_URLS (comma-separated, trimmed) when set", () => {
    vi.stubEnv("VITE_STUN_URLS", " stun:stun.example.com:3478 , stun:stun2.example.com:3478 ");
    const servers = defaultIceServers();
    expect(servers).toHaveLength(1);
    expect(servers[0].urls).toEqual(["stun:stun.example.com:3478", "stun:stun2.example.com:3478"]);
  });

  it("falls back to defaults when VITE_STUN_URLS is only whitespace/commas", () => {
    vi.stubEnv("VITE_STUN_URLS", "   ,  ");
    const servers = defaultIceServers();
    expect(servers[0].urls).toEqual(FALLBACK);
  });
});

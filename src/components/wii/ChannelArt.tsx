import type { ChannelKind } from "./channels";

type Props = {
  kind: ChannelKind;
  accent: string;
  accentSoft: string;
  size?: "tile" | "hero" | "screen";
  spinning?: boolean;
};

export function ChannelArt({ kind, accent, accentSoft, size = "tile", spinning }: Props) {
  const dim =
    size === "screen"
      ? "w-40 h-40 sm:w-48 sm:h-48"
      : size === "hero"
        ? "w-28 h-28"
        : "w-[64%] max-w-[88px] aspect-square";

  if (kind === "empty") {
    return (
      <div
        className={`${dim} rounded-xl border-2 border-dashed border-wii-subtle/50 bg-white/20`}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`${dim} relative rounded-[18%] shadow-sm overflow-hidden`}
      style={{
        background: `linear-gradient(160deg, ${accentSoft} 0%, #fff 55%, ${accentSoft} 100%)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 28%, transparent)`,
      }}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center p-[12%]">
        {renderGlyph(kind, accent, spinning)}
      </div>
      <div
        className="absolute inset-x-0 top-0 h-1/2 opacity-40 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

function renderGlyph(kind: ChannelKind, accent: string, spinning?: boolean) {
  const stroke = accent;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "disc":
      return (
        <svg viewBox="0 0 64 64" className={`w-full h-full ${spinning ? "wii-disc-spin" : ""}`}>
          <circle cx="32" cy="32" r="24" fill={accent} opacity="0.12" />
          <circle cx="32" cy="32" r="22" {...common} strokeWidth="2.4" />
          <circle cx="32" cy="32" r="8" {...common} />
          <circle cx="32" cy="32" r="2.5" fill={stroke} stroke="none" />
          <path d="M32 10 v6 M32 48 v6 M10 32 h6 M48 32 h6" {...common} strokeWidth="1.8" opacity="0.55" />
        </svg>
      );
    case "mii":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="28" r="16" fill={accent} opacity="0.15" />
          <circle cx="32" cy="28" r="15" {...common} />
          <circle cx="26" cy="26" r="2.2" fill={stroke} stroke="none" />
          <circle cx="38" cy="26" r="2.2" fill={stroke} stroke="none" />
          <path d="M25 34c2.5 3 11.5 3 14 0" {...common} />
          <path d="M20 48c3-6 21-6 24 0" {...common} />
        </svg>
      );
    case "photo":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="10" y="16" width="44" height="32" rx="5" fill={accent} opacity="0.12" />
          <rect x="10" y="16" width="44" height="32" rx="5" {...common} />
          <circle cx="24" cy="28" r="5" {...common} />
          <path d="M14 42l12-10 10 8 8-6 6 8" {...common} />
        </svg>
      );
    case "news":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="12" y="12" width="40" height="40" rx="4" fill={accent} opacity="0.12" />
          <rect x="12" y="12" width="40" height="40" rx="4" {...common} />
          <path d="M20 22h24 M20 30h18 M20 38h22 M20 46h12" {...common} strokeWidth="2" />
        </svg>
      );
    case "forecast":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="26" cy="26" r="10" fill={accent} opacity="0.18" />
          <circle cx="26" cy="26" r="8" {...common} />
          <path
            d="M38 40c6 0 10-3.5 10-8s-4-8-9-8c-1-6-6-10-12-10-7 0-12 5-12 12 0 .5 0 1 .1 1.5C11 28 8 32 8 36.5 8 41.2 12 45 18 45h20"
            {...common}
          />
        </svg>
      );
    case "shop":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path d="M16 24h32l-3 26H19L16 24z" fill={accent} opacity="0.12" />
          <path d="M16 24h32l-3 26H19L16 24z" {...common} />
          <path d="M24 24v-4a8 8 0 0 1 16 0v4" {...common} />
          <path d="M24 34v8 M40 34v8" {...common} />
        </svg>
      );
    case "internet":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="18" fill={accent} opacity="0.12" />
          <circle cx="32" cy="32" r="18" {...common} />
          <ellipse cx="32" cy="32" rx="8" ry="18" {...common} />
          <path d="M14 32h36 M16 24h32 M16 40h32" {...common} strokeWidth="1.8" />
        </svg>
      );
    case "votes":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="10" y="18" width="18" height="28" rx="4" fill={accent} opacity="0.12" />
          <rect x="36" y="18" width="18" height="28" rx="4" fill={accent} opacity="0.12" />
          <rect x="10" y="18" width="18" height="28" rx="4" {...common} />
          <rect x="36" y="18" width="18" height="28" rx="4" {...common} />
          <path d="M16 32h6 M42 28v10" {...common} />
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M12 18h40a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H28l-10 8v-8H12a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z"
            fill={accent}
            opacity="0.12"
          />
          <path
            d="M12 18h40a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H28l-10 8v-8H12a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z"
            {...common}
          />
          <path d="M20 30h24 M20 36h14" {...common} />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="12" y="14" width="40" height="38" rx="5" fill={accent} opacity="0.12" />
          <rect x="12" y="14" width="40" height="38" rx="5" {...common} />
          <path d="M12 26h40 M22 10v10 M42 10v10" {...common} />
          <circle cx="24" cy="36" r="2.2" fill={stroke} stroke="none" />
          <circle cx="32" cy="36" r="2.2" fill={stroke} stroke="none" />
          <circle cx="40" cy="36" r="2.2" fill={stroke} stroke="none" />
        </svg>
      );
    case "checkmii":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="28" cy="26" r="12" fill={accent} opacity="0.12" />
          <circle cx="28" cy="26" r="11" {...common} />
          <circle cx="24" cy="24" r="1.6" fill={stroke} stroke="none" />
          <circle cx="32" cy="24" r="1.6" fill={stroke} stroke="none" />
          <path d="M24 30c1.5 2 6.5 2 8 0" {...common} />
          <path d="M38 36l6 6 10-12" {...common} strokeWidth="2.6" />
        </svg>
      );
    case "homebrew":
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path d="M12 30 L32 14 L52 30 V50 a4 4 0 0 1-4 4 H16 a4 4 0 0 1-4-4z" fill={accent} opacity="0.12" />
          <path d="M12 30 L32 14 L52 30 V50 a4 4 0 0 1-4 4 H16 a4 4 0 0 1-4-4z" {...common} />
          <rect x="26" y="36" width="12" height="18" rx="2" {...common} />
        </svg>
      );
    default:
      return null;
  }
}

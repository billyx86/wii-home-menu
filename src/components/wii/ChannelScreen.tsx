import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CloudSun, Globe, Image, Newspaper, Users } from "lucide-react";
import { ChannelArt } from "./ChannelArt";
import type { ChannelDef } from "./channels";
import { ShopChannel } from "./ShopChannel";

type Props = {
  channel: ChannelDef;
  onExit: () => void;
};

export function ChannelScreen({ channel, onExit }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        // Let shop handle nested back first via its own UI; Esc always returns to menu from channel shell
        if (e.key === "Escape") {
          e.preventDefault();
          onExit();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const isShop = channel.kind === "shop";

  return (
    <div
      className="wii-channel-screen"
      data-shop={isShop ? "true" : "false"}
      style={
        isShop
          ? undefined
          : {
              background: `linear-gradient(165deg, ${channel.accentSoft} 0%, #f4f7fa 42%, color-mix(in srgb, ${channel.accent} 12%, #d8e0ea) 100%)`,
            }
      }
    >
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
        <button type="button" className="wii-bar-btn" onClick={onExit} aria-label="Return to Wii Menu">
          <ArrowLeft className="w-4 h-4" />
          <span>Wii Menu</span>
        </button>
        <div className="text-right">
          <div className="text-sm font-semibold text-wii-fg">{channel.name}</div>
          <div className="text-xs text-wii-muted">{channel.subtitle}</div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-auto px-4 sm:px-8 pb-8">
        <ChannelBody channel={channel} />
      </main>
    </div>
  );
}

function ChannelBody({ channel }: { channel: ChannelDef }) {
  switch (channel.kind) {
    case "disc":
      return <DiscBody channel={channel} />;
    case "mii":
    case "checkmii":
      return <MiiBody channel={channel} />;
    case "photo":
      return <PhotoBody channel={channel} />;
    case "news":
      return <NewsBody channel={channel} />;
    case "forecast":
      return <ForecastBody channel={channel} />;
    case "shop":
      return <ShopChannel />;
    case "internet":
      return <InternetBody channel={channel} />;
    case "votes":
      return <VotesBody channel={channel} />;
    case "message":
    case "calendar":
      return <MessageBody channel={channel} />;
    case "homebrew":
      return <HomeBody channel={channel} />;
    default:
      return <GenericBody channel={channel} />;
  }
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/80 shadow-[0_8px_28px_rgb(70_90_120/0.12)] border border-white/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

function DiscBody({ channel }: { channel: ChannelDef }) {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center gap-6 text-center py-8">
      <div className="wii-breathe">
        <ChannelArt
          kind={channel.kind}
          accent={channel.accent}
          accentSoft={channel.accentSoft}
          size="screen"
          spinning
        />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Please insert a disc</h1>
        <p className="mt-2 text-wii-muted max-w-md mx-auto leading-relaxed">
          When a disc is ready, it will appear here with cover art and a Start button — just like the living-room
          console experience.
        </p>
      </div>
      <Panel className="px-6 py-4 text-sm text-wii-muted">
        Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-wii-bg-soft font-semibold text-wii-fg">Esc</kbd> or use
        Wii Menu to return.
      </Panel>
    </div>
  );
}

function MiiBody({ channel }: { channel: ChannelDef }) {
  const faces = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        hue: (i * 41 + 20) % 360,
        smile: i % 3 !== 0,
      })),
    [],
  );

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Panel className="p-6 flex flex-col items-center gap-3 sm:w-56 shrink-0">
          <ChannelArt kind={channel.kind} accent={channel.accent} accentSoft={channel.accentSoft} size="hero" />
          <div className="text-center">
            <div className="font-semibold">{channel.name}</div>
            <div className="text-xs text-wii-muted mt-1">Plaza open</div>
          </div>
        </Panel>
        <div className="flex-1 w-full">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-wii-accent-deep" />
            Mii Plaza
          </h1>
          <p className="mt-1 text-sm text-wii-muted">A friendly gathering of faces on parade.</p>
          <div className="mt-5 grid grid-cols-4 sm:grid-cols-4 gap-3">
            {faces.map((f) => (
              <div
                key={f.id}
                className="aspect-square rounded-2xl bg-white shadow-sm border border-wii-tile-edge/40 flex items-center justify-center"
                style={{ background: `hsl(${f.hue} 55% 94%)` }}
              >
                <svg viewBox="0 0 48 48" className="w-3/4 h-3/4">
                  <circle cx="24" cy="22" r="14" fill={`hsl(${f.hue} 45% 70%)`} opacity="0.35" />
                  <circle cx="24" cy="22" r="13" fill="none" stroke={`hsl(${f.hue} 40% 40%)`} strokeWidth="1.8" />
                  <circle cx="19" cy="20" r="1.6" fill={`hsl(${f.hue} 40% 30%)`} />
                  <circle cx="29" cy="20" r="1.6" fill={`hsl(${f.hue} 40% 30%)`} />
                  <path
                    d={f.smile ? "M18 27c2 3 10 3 12 0" : "M18 28h12"}
                    fill="none"
                    stroke={`hsl(${f.hue} 40% 30%)`}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoBody({ channel }: { channel: ChannelDef }) {
  const photos = [
    { t: "Sunset pier", c: "linear-gradient(135deg,#f6d365,#fda085)" },
    { t: "Mountain lake", c: "linear-gradient(135deg,#a1c4fd,#c2e9fb)" },
    { t: "City lights", c: "linear-gradient(135deg,#667eea,#764ba2)" },
    { t: "Garden path", c: "linear-gradient(135deg,#d4fc79,#96e6a1)" },
    { t: "Snow day", c: "linear-gradient(135deg,#e0eafc,#cfdef3)" },
    { t: "Beach walk", c: "linear-gradient(135deg,#fbc2eb,#a6c1ee)" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Image className="w-6 h-6" style={{ color: channel.accent }} />
        Photo Album
      </h1>
      <p className="mt-1 text-sm text-wii-muted">Flip through soft memory tiles — no SD card required.</p>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {photos.map((p) => (
          <Panel key={p.t} className="overflow-hidden group">
            <div
              className="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ background: p.c }}
            />
            <div className="px-3 py-2.5 text-sm font-medium text-wii-fg">{p.t}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function NewsBody({ channel }: { channel: ChannelDef }) {
  const items = [
    { region: "World", title: "Clear skies expected across coastal regions this week" },
    { region: "Science", title: "New telescope captures first light of a distant nebula" },
    { region: "Culture", title: "Local festival draws record crowds to the plaza" },
    { region: "Sports", title: "Underdogs clinch the final in a last-minute finish" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Newspaper className="w-6 h-6" style={{ color: channel.accent }} />
        Today's Headlines
      </h1>
      <p className="mt-1 text-sm text-wii-muted">A calm feed of sample stories for your living room.</p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <Panel key={item.title} className="px-4 py-3.5 sm:px-5 flex gap-4 items-start">
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
              style={{ background: channel.accent }}
            >
              {item.region.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-wii-muted">{item.region}</div>
              <div className="mt-0.5 font-medium text-wii-fg leading-snug">{item.title}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function ForecastBody({ channel }: { channel: ChannelDef }) {
  const days = [
    { d: "Mon", t: "22°", i: "Sunny" },
    { d: "Tue", t: "19°", i: "Clouds" },
    { d: "Wed", t: "17°", i: "Showers" },
    { d: "Thu", t: "20°", i: "Clear" },
    { d: "Fri", t: "21°", i: "Breezy" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <CloudSun className="w-6 h-6" style={{ color: channel.accent }} />
        Local Forecast
      </h1>
      <p className="mt-1 text-sm text-wii-muted">Sample weather for a gentle afternoon.</p>
      <Panel className="mt-6 p-5 sm:p-6">
        <div className="flex items-end gap-3">
          <div className="text-5xl sm:text-6xl font-semibold tracking-tight" style={{ color: channel.accent }}>
            21°
          </div>
          <div className="pb-1">
            <div className="font-semibold text-lg">Partly cloudy</div>
            <div className="text-sm text-wii-muted">Feels like 20° · Light breeze</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {days.map((day) => (
            <div
              key={day.d}
              className="rounded-xl bg-wii-bg-soft/80 px-1 py-3 text-center border border-white/60"
            >
              <div className="text-xs font-semibold text-wii-muted">{day.d}</div>
              <div className="mt-2 text-sm font-semibold">{day.t}</div>
              <div className="mt-1 text-[0.65rem] text-wii-subtle leading-tight">{day.i}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function InternetBody({ channel }: { channel: ChannelDef }) {
  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <Globe className="w-6 h-6" style={{ color: channel.accent }} />
        Internet Channel
      </h1>
      <p className="mt-1 text-sm text-wii-muted">A living-room browser frame — demo only.</p>
      <Panel className="mt-6 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-wii-bg-soft/90 border-b border-wii-tile-edge/30">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f07178]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#e6c07b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#98c379]" />
          </div>
          <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-xs text-wii-muted border border-wii-tile-edge/40 truncate">
            https://example.living-room/
          </div>
        </div>
        <div className="p-6 sm:p-10 text-center min-h-[220px] flex flex-col items-center justify-center">
          <ChannelArt kind="internet" accent={channel.accent} accentSoft={channel.accentSoft} size="hero" />
          <p className="mt-4 font-semibold text-lg">Hello from the web</p>
          <p className="mt-1 text-sm text-wii-muted max-w-sm">
            Bookmarks, zoom, and soft page loads — imagined for the couch.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function VotesBody({ channel }: { channel: ChannelDef }) {
  const [choice, setChoice] = useState<"a" | "b" | null>(null);
  const a = choice === "a" ? 68 : choice === "b" ? 41 : 54;
  const b = 100 - a;

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-center">Everybody Votes</h1>
      <p className="mt-2 text-center text-wii-muted">Which snack wins movie night?</p>
      <Panel className="mt-6 p-5 sm:p-6 space-y-4">
        {(
          [
            { id: "a" as const, label: "Popcorn", pct: a },
            { id: "b" as const, label: "Cookies", pct: b },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="w-full text-left rounded-xl border border-wii-tile-edge/50 bg-white/70 px-4 py-3 transition hover:border-wii-accent"
            onClick={() => setChoice(opt.id)}
            data-active={choice === opt.id ? "true" : "false"}
          >
            <div className="flex justify-between text-sm font-semibold">
              <span>{opt.label}</span>
              <span style={{ color: channel.accent }}>{opt.pct}%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-wii-bg-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${opt.pct}%`, background: channel.accent }}
              />
            </div>
          </button>
        ))}
        <p className="text-xs text-center text-wii-subtle pt-1">
          {choice ? "Thanks for voting!" : "Tap an option to cast your vote."}
        </p>
      </Panel>
    </div>
  );
}

function MessageBody({ channel }: { channel: ChannelDef }) {
  const notes = [
    { day: "27", title: "Game night", body: "Bring controllers — rematch night." },
    { day: "28", title: "Photo dump", body: "Load summer album onto the SD card." },
    { day: "30", title: "Shop sale", body: "Check Classics aisle for demos." },
  ];

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{channel.name}</h1>
      <p className="mt-1 text-sm text-wii-muted">Notes pinned to your calendar board.</p>
      <div className="mt-6 space-y-3">
        {notes.map((n) => (
          <Panel key={n.day} className="p-4 flex gap-4">
            <div
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
              style={{ background: channel.accent }}
            >
              <span className="text-[0.65rem] font-semibold uppercase opacity-90">Jul</span>
              <span className="text-xl font-bold leading-none">{n.day}</span>
            </div>
            <div>
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-wii-muted mt-0.5">{n.body}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function HomeBody({ channel }: { channel: ChannelDef }) {
  return (
    <div className="max-w-2xl mx-auto py-8 text-center">
      <ChannelArt kind={channel.kind} accent={channel.accent} accentSoft={channel.accentSoft} size="screen" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Home Channel</h1>
      <p className="mt-2 text-wii-muted max-w-md mx-auto leading-relaxed">
        A cozy shelf for extras, tools, and experiments that live alongside your main channels.
      </p>
      <Panel className="mt-6 px-5 py-4 text-sm text-wii-muted inline-block">
        Demo hub · no extra software installed
      </Panel>
    </div>
  );
}

function GenericBody({ channel }: { channel: ChannelDef }) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <ChannelArt kind={channel.kind} accent={channel.accent} accentSoft={channel.accentSoft} size="screen" />
      <h1 className="mt-6 text-2xl font-semibold">{channel.name}</h1>
      <p className="mt-2 text-wii-muted">{channel.description}</p>
    </div>
  );
}

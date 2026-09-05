import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Gamepad2,
  Gift,
  HelpCircle,
  History,
  Layers,
  MonitorSmartphone,
  Sparkles,
  Tv,
  Wallet,
} from "lucide-react";
import { playBack, playHover, playOpen, playSelect } from "./audio";
import { getSavedShopState, persistShopState } from "./shopState";

/** Fan recreation of Wii Shop Channel IA + chrome — original demo catalog only. */

type ShopView =
  | { kind: "welcome" }
  | { kind: "hub" }
  | { kind: "catalog"; category: ShopCategoryId; page: number }
  | { kind: "detail"; category: ShopCategoryId; titleId: string; page: number }
  | { kind: "points" }
  | { kind: "downloads" }
  | { kind: "guide" };

type ShopCategoryId = "virtual" | "wiiware" | "channels";

type ShopTitle = {
  id: string;
  name: string;
  publisher: string;
  system: string;
  genre: string;
  price: number;
  players: string;
  rating: string;
  blurb: string;
  hue: number;
  category: ShopCategoryId;
};

const CATALOG: ShopTitle[] = [
  {
    id: "vc-meadow",
    name: "Meadow Knight",
    publisher: "Pixel Grove",
    system: "8-bit Classics",
    genre: "Action",
    price: 500,
    players: "1",
    rating: "Everyone",
    blurb: "A side-scrolling quest through sunlit fields and castle halls.",
    hue: 210,
    category: "virtual",
  },
  {
    id: "vc-orbit",
    name: "Orbit Patrol",
    publisher: "Starbit Soft",
    system: "16-bit Classics",
    genre: "Shooter",
    price: 800,
    players: "1–2",
    rating: "Everyone 10+",
    blurb: "Pilot a tiny ship through neon asteroid belts and boss stations.",
    hue: 265,
    category: "virtual",
  },
  {
    id: "vc-harbor",
    name: "Harbor Dash",
    publisher: "Coastline Co.",
    system: "8-bit Classics",
    genre: "Racing",
    price: 500,
    players: "1–2",
    rating: "Everyone",
    blurb: "Zip past docks and lighthouses in a breezy top-down racer.",
    hue: 195,
    category: "virtual",
  },
  {
    id: "vc-castle",
    name: "Castle Capers 64",
    publisher: "North Peak",
    system: "3D Classics",
    genre: "Adventure",
    price: 1000,
    players: "1",
    rating: "Everyone",
    blurb: "Explore a sprawling courtyard castle with camera-tilt charm.",
    hue: 12,
    category: "virtual",
  },
  {
    id: "vc-arcade",
    name: "Vector Blitz",
    publisher: "Neon Arcade",
    system: "Arcade Classics",
    genre: "Arcade",
    price: 900,
    players: "1–2",
    rating: "Everyone 10+",
    blurb: "Crisp vector lines, high-score tables, and two-player co-op.",
    hue: 330,
    category: "virtual",
  },
  {
    id: "vc-tune",
    name: "Melody Master",
    publisher: "Soft Piano",
    system: "16-bit Classics",
    genre: "Music",
    price: 600,
    players: "1",
    rating: "Everyone",
    blurb: "Compose short jingles and clear rhythm stages with a light pen feel.",
    hue: 45,
    category: "virtual",
  },
  {
    id: "ww-balloon",
    name: "Balloon Picnic",
    publisher: "Cloud Kitten",
    system: "WiiWare",
    genre: "Party",
    price: 700,
    players: "1–4",
    rating: "Everyone",
    blurb: "Keep balloons aloft with motion-friendly flicks and couch chaos.",
    hue: 340,
    category: "wiiware",
  },
  {
    id: "ww-garden",
    name: "Pocket Garden",
    publisher: "Fern Lab",
    system: "WiiWare",
    genre: "Simulation",
    price: 1000,
    players: "1",
    rating: "Everyone",
    blurb: "Grow a quiet rooftop garden and trade seeds with Miis in the plaza.",
    hue: 140,
    category: "wiiware",
  },
  {
    id: "ww-sketch",
    name: "Sketch Duel",
    publisher: "Ink & Play",
    system: "WiiWare",
    genre: "Puzzle",
    price: 800,
    players: "1–2",
    rating: "Everyone",
    blurb: "Draw shapes that become platforms — race a friend to the exit.",
    hue: 25,
    category: "wiiware",
  },
  {
    id: "ww-drift",
    name: "Drift Kart Mini",
    publisher: "Corner Apex",
    system: "WiiWare",
    genre: "Racing",
    price: 1200,
    players: "1–4",
    rating: "Everyone",
    blurb: "Tiny tracks, big slides, and item boxes that stay friendly.",
    hue: 200,
    category: "wiiware",
  },
  {
    id: "ww-echo",
    name: "Echo Chamber",
    publisher: "Soft Wave",
    system: "WiiWare",
    genre: "Music",
    price: 600,
    players: "1",
    rating: "Everyone",
    blurb: "Point the remote like a baton and conduct a living-room orchestra.",
    hue: 280,
    category: "wiiware",
  },
  {
    id: "ch-photoplus",
    name: "Photo Plus",
    publisher: "Menu Studio",
    system: "Channel",
    genre: "Utility",
    price: 0,
    players: "—",
    rating: "Everyone",
    blurb: "Extra album tools and slideshow themes for your Photo Channel.",
    hue: 160,
    category: "channels",
  },
  {
    id: "ch-newsdesk",
    name: "News Desk",
    publisher: "Menu Studio",
    system: "Channel",
    genre: "Info",
    price: 0,
    players: "—",
    rating: "Everyone",
    blurb: "A wider headline board with region filters and a soft ticker.",
    hue: 220,
    category: "channels",
  },
  {
    id: "ch-forecastpro",
    name: "Sky Globe",
    publisher: "Menu Studio",
    system: "Channel",
    genre: "Info",
    price: 0,
    players: "—",
    rating: "Everyone",
    blurb: "Spin a friendly globe and peek at sample weather worldwide.",
    hue: 190,
    category: "channels",
  },
];

const PAGE_SIZE = 4;

const CATEGORIES: {
  id: ShopCategoryId;
  title: string;
  subtitle: string;
  accent: string;
  soft: string;
  Icon: typeof Gamepad2;
}[] = [
  {
    id: "virtual",
    title: "Virtual Console",
    subtitle: "Classic systems, reborn for the living room",
    accent: "#2f7fd4",
    soft: "#d9ecff",
    Icon: Tv,
  },
  {
    id: "wiiware",
    title: "WiiWare",
    subtitle: "Fresh downloads built for remote play",
    accent: "#d45a8a",
    soft: "#fce0ec",
    Icon: Sparkles,
  },
  {
    id: "channels",
    title: "Wii Channels",
    subtitle: "Extra channels for your Home Menu",
    accent: "#3a9a6a",
    soft: "#d8f5e8",
    Icon: Layers,
  },
];

export function ShopChannel() {
  // Hydrate once from localStorage so purchases/top-ups survive a reload
  // (#13) — mirroring how the Home Menu restores position via menuState.
  const [saved] = useState(() => getSavedShopState());
  const [view, setView] = useState<ShopView>({ kind: "welcome" });
  const [points, setPoints] = useState(saved.points);
  const [owned, setOwned] = useState<string[]>(saved.owned);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist points/owned whenever they change; no-ops when storage is
  // unavailable (private mode, quota).
  useEffect(() => {
    persistShopState({ points, owned });
  }, [points, owned]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // Clear any pending hide timer on unmount so a stale timeout never fires
  // against an unmounted component.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const go = (next: ShopView) => {
    playSelect();
    setView(next);
  };

  const back = () => {
    playBack();
    if (view.kind === "detail") {
      setView({ kind: "catalog", category: view.category, page: view.page });
    } else if (view.kind === "catalog" || view.kind === "points" || view.kind === "downloads" || view.kind === "guide") {
      setView({ kind: "hub" });
    } else if (view.kind === "hub") {
      setView({ kind: "welcome" });
    }
  };

  return (
    <div className="shop-shell">
      <div className="shop-shell-glow" aria-hidden />

      {view.kind === "welcome" && (
        <WelcomeScreen
          onStart={() => {
            playOpen();
            setView({ kind: "hub" });
          }}
        />
      )}

      {view.kind === "hub" && (
        <HubScreen
          points={points}
          onCategory={(id) => go({ kind: "catalog", category: id, page: 0 })}
          onPoints={() => go({ kind: "points" })}
          onDownloads={() => go({ kind: "downloads" })}
          onGuide={() => go({ kind: "guide" })}
        />
      )}

      {view.kind === "catalog" && (
        <CatalogScreen
          category={view.category}
          page={view.page}
          points={points}
          owned={owned}
          onBack={back}
          onPage={(page) => {
            playHover();
            setView({ kind: "catalog", category: view.category, page });
          }}
          onOpen={(titleId) => go({ kind: "detail", category: view.category, titleId, page: view.page })}
        />
      )}

      {view.kind === "detail" && (
        <DetailScreen
          titleId={view.titleId}
          points={points}
          owned={owned.includes(view.titleId)}
          onBack={back}
          onDownload={() => {
            const title = CATALOG.find((t) => t.id === view.titleId);
            if (!title) return;
            if (owned.includes(title.id)) {
              playSelect();
              showToast("Already on your console — re-download free.");
              return;
            }
            if (title.price > points) {
              playBack();
              showToast("Not enough Wii Points.");
              return;
            }
            playOpen();
            setPoints((p) => p - title.price);
            setOwned((o) => [...o, title.id]);
            showToast(`Downloaded · ${title.name}`);
          }}
          onGift={() => {
            playSelect();
            showToast("Gift message queued for a Wii Friend (demo).");
          }}
        />
      )}

      {view.kind === "points" && (
        <PointsScreen
          points={points}
          onBack={back}
          onAdd={(n) => {
            playOpen();
            setPoints((p) => p + n);
            showToast(`Added ${n.toLocaleString()} Wii Points`);
          }}
        />
      )}

      {view.kind === "downloads" && (
        <DownloadsScreen
          owned={owned}
          onBack={back}
          onOpen={(titleId) => {
            const t = CATALOG.find((x) => x.id === titleId);
            if (!t) return;
            go({ kind: "detail", category: t.category, titleId, page: 0 });
          }}
        />
      )}

      {view.kind === "guide" && <GuideScreen onBack={back} />}

      {toast && (
        <div className="shop-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="shop-welcome">
      <div className="shop-bag-hero wii-breathe" aria-hidden>
        <ShoppingBagIcon />
      </div>
      <h1 className="shop-title">Wii Shop Channel</h1>
      <p className="shop-lead">
        Browse classics, downloadable software, and extra channels — paid with Wii Points, ready for your Home Menu.
      </p>
      <button type="button" className="shop-cta" onClick={onStart}>
        Start Shopping
      </button>
      <p className="shop-footnote">Demo catalog · no real purchases</p>
    </div>
  );
}

function HubScreen({
  points,
  onCategory,
  onPoints,
  onDownloads,
  onGuide,
}: {
  points: number;
  onCategory: (id: ShopCategoryId) => void;
  onPoints: () => void;
  onDownloads: () => void;
  onGuide: () => void;
}) {
  return (
    <div className="shop-hub">
      <header className="shop-hub-head">
        <div>
          <div className="shop-kicker">Wii Shop Channel</div>
          <h1 className="shop-hub-title">What would you like to shop for?</h1>
        </div>
        <button type="button" className="shop-points-chip" onClick={onPoints}>
          <Wallet className="w-4 h-4" />
          <span>{points.toLocaleString()}</span>
          <span className="shop-points-label">Wii Points</span>
        </button>
      </header>

      <div className="shop-cat-grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="shop-cat-card"
            style={{ ["--cat-accent" as string]: cat.accent, ["--cat-soft" as string]: cat.soft }}
            onClick={() => onCategory(cat.id)}
            onMouseEnter={() => playHover()}
          >
            <span className="shop-cat-icon">
              <cat.Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.75} />
            </span>
            <span className="shop-cat-copy">
              <span className="shop-cat-name">{cat.title}</span>
              <span className="shop-cat-sub">{cat.subtitle}</span>
            </span>
            <ArrowRight className="shop-cat-arrow w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="shop-hub-tools">
        <ToolBtn icon={Wallet} label="Add Wii Points" onClick={onPoints} />
        <ToolBtn icon={Download} label="Titles You've Downloaded" onClick={onDownloads} />
        <ToolBtn icon={HelpCircle} label="Shopping Guide" onClick={onGuide} />
        <ToolBtn icon={History} label="Account Activity" onClick={onPoints} />
      </div>
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Wallet;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="shop-tool" onClick={onClick} onMouseEnter={() => playHover()}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function CatalogScreen({
  category,
  page,
  points,
  owned,
  onBack,
  onPage,
  onOpen,
}: {
  category: ShopCategoryId;
  page: number;
  points: number;
  owned: string[];
  onBack: () => void;
  onPage: (p: number) => void;
  onOpen: (id: string) => void;
}) {
  const meta = CATEGORIES.find((c) => c.id === category)!;
  const list = useMemo(() => CATALOG.filter((t) => t.category === category), [category]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="shop-panel-view">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">{meta.title}</div>
            <h2 className="shop-panel-title">Popular Titles</h2>
          </div>
          <div className="shop-panel-actions">
            <button type="button" className="shop-icon-btn" aria-label="Help" onClick={() => playSelect()}>
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ul className="shop-list">
          {slice.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="shop-list-row"
                onClick={() => onOpen(t.id)}
                onMouseEnter={() => playHover()}
              >
                <TitleThumb title={t} />
                <span className="shop-list-meta">
                  <span className="shop-list-name">
                    {t.name}
                    {owned.includes(t.id) && <span className="shop-owned-tag">Owned</span>}
                  </span>
                  <span className="shop-list-sub">
                    {t.publisher}
                    <span className="shop-dot">·</span>
                    {t.system}
                  </span>
                </span>
                <span className="shop-list-price">
                  {t.price === 0 ? "Free" : `${t.price.toLocaleString()} Points`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="shop-foot-center">
            <span className="shop-balance">{points.toLocaleString()} Wii Points</span>
            <span className="shop-page-ind">
              {page + 1}/{pages}
            </span>
          </div>
          <div className="shop-page-nav">
            <button
              type="button"
              className="shop-icon-btn"
              disabled={page <= 0}
              aria-label="Previous page"
              onClick={() => onPage(page - 1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="shop-icon-btn"
              disabled={page >= pages - 1}
              aria-label="Next page"
              onClick={() => onPage(page + 1)}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailScreen({
  titleId,
  points,
  owned,
  onBack,
  onDownload,
  onGift,
}: {
  titleId: string;
  points: number;
  owned: boolean;
  onBack: () => void;
  onDownload: () => void;
  onGift: () => void;
}) {
  const title = CATALOG.find((t) => t.id === titleId);
  if (!title) return null;

  return (
    <div className="shop-panel-view">
      <div className="shop-panel shop-detail">
        <div className="shop-detail-top">
          <TitleThumb title={title} large />
          <div className="min-w-0">
            <div className="shop-kicker">{title.system}</div>
            <h2 className="shop-panel-title">{title.name}</h2>
            <p className="shop-detail-pub">{title.publisher}</p>
            <p className="shop-detail-blurb">{title.blurb}</p>
          </div>
        </div>

        <dl className="shop-facts">
          <div>
            <dt>Genre</dt>
            <dd>{title.genre}</dd>
          </div>
          <div>
            <dt>Players</dt>
            <dd>{title.players}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>{title.rating}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{title.price === 0 ? "Free" : `${title.price.toLocaleString()} Wii Points`}</dd>
          </div>
        </dl>

        <div className="shop-detail-actions">
          <button type="button" className="shop-cta shop-cta-sm" onClick={onDownload}>
            <Download className="w-4 h-4" />
            {owned ? "Re-download" : title.price === 0 ? "Download Free" : "Download"}
          </button>
          <button type="button" className="shop-secondary" onClick={onGift}>
            <Gift className="w-4 h-4" />
            Gift
          </button>
          <button type="button" className="shop-back-btn" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="shop-detail-balance">
          Your balance · <strong>{points.toLocaleString()}</strong> Wii Points
          {owned && <span className="shop-owned-tag ml-2">On this console</span>}
        </div>
      </div>
    </div>
  );
}

function PointsScreen({
  points,
  onBack,
  onAdd,
}: {
  points: number;
  onBack: () => void;
  onAdd: (n: number) => void;
}) {
  const packs = [1000, 2000, 3000, 5000];
  return (
    <div className="shop-panel-view">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">Account</div>
            <h2 className="shop-panel-title">Add Wii Points</h2>
          </div>
        </div>
        <p className="shop-inline-note">
          Current balance: <strong>{points.toLocaleString()}</strong> Wii Points. Demo packs only — nothing is charged.
        </p>
        <div className="shop-packs">
          {packs.map((n) => (
            <button key={n} type="button" className="shop-pack" onClick={() => onAdd(n)} onMouseEnter={() => playHover()}>
              <Wallet className="w-5 h-5 text-wii-accent-deep" />
              <span className="font-semibold">{n.toLocaleString()}</span>
              <span className="text-xs text-wii-muted">Wii Points</span>
            </button>
          ))}
        </div>
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

function DownloadsScreen({
  owned,
  onBack,
  onOpen,
}: {
  owned: string[];
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const list = CATALOG.filter((t) => owned.includes(t.id));
  return (
    <div className="shop-panel-view">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">Library</div>
            <h2 className="shop-panel-title">Titles You've Downloaded</h2>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="shop-inline-note">No downloads yet. Grab something from Virtual Console or WiiWare.</p>
        ) : (
          <ul className="shop-list">
            {list.map((t) => (
              <li key={t.id}>
                <button type="button" className="shop-list-row" onClick={() => onOpen(t.id)}>
                  <TitleThumb title={t} />
                  <span className="shop-list-meta">
                    <span className="shop-list-name">{t.name}</span>
                    <span className="shop-list-sub">{t.system}</span>
                  </span>
                  <span className="shop-list-price">Free re-download</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

function GuideScreen({ onBack }: { onBack: () => void }) {
  const steps = [
    { t: "Start Shopping", d: "Enter the shop from the welcome screen to see the three main aisles." },
    { t: "Pick a category", d: "Virtual Console for classics, WiiWare for new downloads, Channels for menu extras." },
    { t: "Browse the list", d: "Each row shows cover art, publisher, system, and price in Wii Points." },
    { t: "Download or Gift", d: "Confirm a title to download to this console, or queue a gift for a friend." },
    { t: "Add Points", d: "Top up your balance anytime — in this demo, packs are free samples." },
  ];
  return (
    <div className="shop-panel-view">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">Help</div>
            <h2 className="shop-panel-title">Shopping Guide</h2>
          </div>
        </div>
        <ol className="shop-guide">
          {steps.map((s, i) => (
            <li key={s.t}>
              <span className="shop-guide-num">{i + 1}</span>
              <span>
                <span className="font-semibold text-wii-fg block">{s.t}</span>
                <span className="text-sm text-wii-muted">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

function TitleThumb({ title, large }: { title: ShopTitle; large?: boolean }) {
  const size = large ? "w-24 h-24 sm:w-28 sm:h-28" : "w-12 h-12 sm:w-14 sm:h-14";
  return (
    <span
      className={`shop-thumb ${size}`}
      style={{
        background: `linear-gradient(145deg, hsl(${title.hue} 70% 92%), hsl(${title.hue} 55% 72%))`,
      }}
      aria-hidden
    >
      <span className="shop-thumb-glyph">
        {title.category === "virtual" ? (
          <Gamepad2 className="w-[45%] h-[45%]" strokeWidth={1.75} />
        ) : title.category === "wiiware" ? (
          <Sparkles className="w-[45%] h-[45%]" strokeWidth={1.75} />
        ) : (
          <MonitorSmartphone className="w-[45%] h-[45%]" strokeWidth={1.75} />
        )}
      </span>
    </span>
  );
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ec8f5" />
          <stop offset="100%" stopColor="#3a8fd6" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="108" rx="34" ry="6" fill="rgb(70 100 140 / 0.15)" />
      <path
        d="M28 42 h64 l-6 58 a10 10 0 0 1-10 9 H44 a10 10 0 0 1-10-9 Z"
        fill="url(#bag)"
        stroke="#1f6fb8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M42 42 V34 a18 18 0 0 1 36 0 v8"
        fill="none"
        stroke="#1f6fb8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="60"
        y="78"
        textAnchor="middle"
        fill="#fff"
        fontSize="22"
        fontWeight="700"
        fontFamily="Segoe UI, system-ui, sans-serif"
      >
        Wii
      </text>
      <path d="M86 30c10-2 22 4 26 14" fill="none" stroke="#f0b84a" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      <path d="M88 40c8 0 16 4 20 10" fill="none" stroke="#f0b84a" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

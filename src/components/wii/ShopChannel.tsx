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
import { t } from "../../lib/i18n";
import { playBack, playHover, playOpen, playSelect } from "./audio";
import { getSavedShopState, persistShopState, subscribeShopState } from "./shopState";

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

/**
 * A catalog entry. All display copy is stored as `*Key` i18n keys
 * (`shop.title.<id>.<field>`) resolved at render time via `t()` — prices,
 * player counts, and hues stay as plain data. A second locale is therefore a
 * pure data drop-in (see `src/lib/i18n/en.ts`).
 */
type ShopTitle = {
  id: string;
  nameKey: string;
  publisherKey: string;
  systemKey: string;
  genreKey: string;
  ratingKey: string;
  blurbKey: string;
  price: number;
  players: string;
  hue: number;
  category: ShopCategoryId;
};

/** i18n key for a catalog field, e.g. `shop.title.vc-meadow.name`. */
const titleKey = (id: string, field: "name" | "publisher" | "system" | "genre" | "rating" | "blurb") =>
  `shop.title.${id}.${field}`;

const CATALOG: ShopTitle[] = [
  {
    id: "vc-meadow",
    nameKey: titleKey("vc-meadow", "name"),
    publisherKey: titleKey("vc-meadow", "publisher"),
    systemKey: titleKey("vc-meadow", "system"),
    genreKey: titleKey("vc-meadow", "genre"),
    ratingKey: titleKey("vc-meadow", "rating"),
    blurbKey: titleKey("vc-meadow", "blurb"),
    price: 500,
    players: "1",
    hue: 210,
    category: "virtual",
  },
  {
    id: "vc-orbit",
    nameKey: titleKey("vc-orbit", "name"),
    publisherKey: titleKey("vc-orbit", "publisher"),
    systemKey: titleKey("vc-orbit", "system"),
    genreKey: titleKey("vc-orbit", "genre"),
    ratingKey: titleKey("vc-orbit", "rating"),
    blurbKey: titleKey("vc-orbit", "blurb"),
    price: 800,
    players: "1–2",
    hue: 265,
    category: "virtual",
  },
  {
    id: "vc-harbor",
    nameKey: titleKey("vc-harbor", "name"),
    publisherKey: titleKey("vc-harbor", "publisher"),
    systemKey: titleKey("vc-harbor", "system"),
    genreKey: titleKey("vc-harbor", "genre"),
    ratingKey: titleKey("vc-harbor", "rating"),
    blurbKey: titleKey("vc-harbor", "blurb"),
    price: 500,
    players: "1–2",
    hue: 195,
    category: "virtual",
  },
  {
    id: "vc-castle",
    nameKey: titleKey("vc-castle", "name"),
    publisherKey: titleKey("vc-castle", "publisher"),
    systemKey: titleKey("vc-castle", "system"),
    genreKey: titleKey("vc-castle", "genre"),
    ratingKey: titleKey("vc-castle", "rating"),
    blurbKey: titleKey("vc-castle", "blurb"),
    price: 1000,
    players: "1",
    hue: 12,
    category: "virtual",
  },
  {
    id: "vc-arcade",
    nameKey: titleKey("vc-arcade", "name"),
    publisherKey: titleKey("vc-arcade", "publisher"),
    systemKey: titleKey("vc-arcade", "system"),
    genreKey: titleKey("vc-arcade", "genre"),
    ratingKey: titleKey("vc-arcade", "rating"),
    blurbKey: titleKey("vc-arcade", "blurb"),
    price: 900,
    players: "1–2",
    hue: 330,
    category: "virtual",
  },
  {
    id: "vc-tune",
    nameKey: titleKey("vc-tune", "name"),
    publisherKey: titleKey("vc-tune", "publisher"),
    systemKey: titleKey("vc-tune", "system"),
    genreKey: titleKey("vc-tune", "genre"),
    ratingKey: titleKey("vc-tune", "rating"),
    blurbKey: titleKey("vc-tune", "blurb"),
    price: 600,
    players: "1",
    hue: 45,
    category: "virtual",
  },
  {
    id: "ww-balloon",
    nameKey: titleKey("ww-balloon", "name"),
    publisherKey: titleKey("ww-balloon", "publisher"),
    systemKey: titleKey("ww-balloon", "system"),
    genreKey: titleKey("ww-balloon", "genre"),
    ratingKey: titleKey("ww-balloon", "rating"),
    blurbKey: titleKey("ww-balloon", "blurb"),
    price: 700,
    players: "1–4",
    hue: 340,
    category: "wiiware",
  },
  {
    id: "ww-garden",
    nameKey: titleKey("ww-garden", "name"),
    publisherKey: titleKey("ww-garden", "publisher"),
    systemKey: titleKey("ww-garden", "system"),
    genreKey: titleKey("ww-garden", "genre"),
    ratingKey: titleKey("ww-garden", "rating"),
    blurbKey: titleKey("ww-garden", "blurb"),
    price: 1000,
    players: "1",
    hue: 140,
    category: "wiiware",
  },
  {
    id: "ww-sketch",
    nameKey: titleKey("ww-sketch", "name"),
    publisherKey: titleKey("ww-sketch", "publisher"),
    systemKey: titleKey("ww-sketch", "system"),
    genreKey: titleKey("ww-sketch", "genre"),
    ratingKey: titleKey("ww-sketch", "rating"),
    blurbKey: titleKey("ww-sketch", "blurb"),
    price: 800,
    players: "1–2",
    hue: 25,
    category: "wiiware",
  },
  {
    id: "ww-drift",
    nameKey: titleKey("ww-drift", "name"),
    publisherKey: titleKey("ww-drift", "publisher"),
    systemKey: titleKey("ww-drift", "system"),
    genreKey: titleKey("ww-drift", "genre"),
    ratingKey: titleKey("ww-drift", "rating"),
    blurbKey: titleKey("ww-drift", "blurb"),
    price: 1200,
    players: "1–4",
    hue: 200,
    category: "wiiware",
  },
  {
    id: "ww-echo",
    nameKey: titleKey("ww-echo", "name"),
    publisherKey: titleKey("ww-echo", "publisher"),
    systemKey: titleKey("ww-echo", "system"),
    genreKey: titleKey("ww-echo", "genre"),
    ratingKey: titleKey("ww-echo", "rating"),
    blurbKey: titleKey("ww-echo", "blurb"),
    price: 600,
    players: "1",
    hue: 280,
    category: "wiiware",
  },
  {
    id: "ch-photoplus",
    nameKey: titleKey("ch-photoplus", "name"),
    publisherKey: titleKey("ch-photoplus", "publisher"),
    systemKey: titleKey("ch-photoplus", "system"),
    genreKey: titleKey("ch-photoplus", "genre"),
    ratingKey: titleKey("ch-photoplus", "rating"),
    blurbKey: titleKey("ch-photoplus", "blurb"),
    price: 0,
    players: "—",
    hue: 160,
    category: "channels",
  },
  {
    id: "ch-newsdesk",
    nameKey: titleKey("ch-newsdesk", "name"),
    publisherKey: titleKey("ch-newsdesk", "publisher"),
    systemKey: titleKey("ch-newsdesk", "system"),
    genreKey: titleKey("ch-newsdesk", "genre"),
    ratingKey: titleKey("ch-newsdesk", "rating"),
    blurbKey: titleKey("ch-newsdesk", "blurb"),
    price: 0,
    players: "—",
    hue: 220,
    category: "channels",
  },
  {
    id: "ch-forecastpro",
    nameKey: titleKey("ch-forecastpro", "name"),
    publisherKey: titleKey("ch-forecastpro", "publisher"),
    systemKey: titleKey("ch-forecastpro", "system"),
    genreKey: titleKey("ch-forecastpro", "genre"),
    ratingKey: titleKey("ch-forecastpro", "rating"),
    blurbKey: titleKey("ch-forecastpro", "blurb"),
    price: 0,
    players: "—",
    hue: 190,
    category: "channels",
  },
];

const PAGE_SIZE = 4;

const CATEGORIES: {
  id: ShopCategoryId;
  titleKey: string;
  subtitleKey: string;
  accent: string;
  soft: string;
  Icon: typeof Gamepad2;
}[] = [
  {
    id: "virtual",
    titleKey: "shop.cat.virtual.title",
    subtitleKey: "shop.cat.virtual.subtitle",
    accent: "#2f7fd4",
    soft: "#d9ecff",
    Icon: Tv,
  },
  {
    id: "wiiware",
    titleKey: "shop.cat.wiiware.title",
    subtitleKey: "shop.cat.wiiware.subtitle",
    accent: "#d45a8a",
    soft: "#fce0ec",
    Icon: Sparkles,
  },
  {
    id: "channels",
    titleKey: "shop.cat.channels.title",
    subtitleKey: "shop.cat.channels.subtitle",
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
  const [toast, setToast] = useState<{ key: string; text: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist points/owned whenever they change; no-ops when storage is
  // unavailable (private mode, quota).
  useEffect(() => {
    persistShopState({ points, owned });
  }, [points, owned]);

  // Cross-tab sync (#17): a purchase or top-up made in another tab writes
  // `wii.shop` and fires a `storage` event here — adopt it so the balance and
  // the download list update without a reload. The subscription ignores
  // malformed payloads and its own tab's writes (see shopState.ts).
  useEffect(() => {
    return subscribeShopState((next) => {
      setPoints(next.points);
      setOwned(next.owned);
    });
  }, []);

  const showToast = (key: string, msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ key, text: msg });
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
              showToast("shop.toast.reowned", t("shop.toast.reowned"));
              return;
            }
            if (title.price > points) {
              playBack();
              showToast("shop.toast.insufficient", t("shop.toast.insufficient"));
              return;
            }
            playOpen();
            setPoints((p) => p - title.price);
            setOwned((o) => [...o, title.id]);
            showToast("shop.toast.downloaded", t("shop.toast.downloaded", { title: t(title.nameKey) }));
          }}
          onGift={() => {
            playSelect();
            showToast("shop.toast.gift", t("shop.toast.gift"));
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
            showToast("shop.toast.added", t("shop.toast.added", { points: n.toLocaleString() }));
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
        <div className="shop-toast" role="status" data-testid="shop-toast" data-toast-key={toast.key}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="shop-welcome" data-testid="shop-welcome">
      <div className="shop-bag-hero wii-breathe" aria-hidden>
        <ShoppingBagIcon />
      </div>
      <h1 className="shop-title">{t("shop.title")}</h1>
      <p className="shop-lead">{t("shop.lead")}</p>
      <button type="button" className="shop-cta" data-testid="shop-start-shopping" onClick={onStart}>
        {t("shop.start")}
      </button>
      <p className="shop-footnote">{t("shop.demoNote")}</p>
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
    <div className="shop-hub" data-testid="shop-hub">
      <header className="shop-hub-head">
        <div>
          <div className="shop-kicker">{t("shop.title")}</div>
          <h1 className="shop-hub-title" data-testid="shop-hub-title">
            {t("shop.hubTitle")}
          </h1>
        </div>
        <button type="button" className="shop-points-chip" data-testid="shop-points-chip" onClick={onPoints}>
          <Wallet className="w-4 h-4" />
          <span>{points.toLocaleString()}</span>
          <span className="shop-points-label">{t("shop.pointsLabel")}</span>
        </button>
      </header>

      <div className="shop-cat-grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="shop-cat-card"
            data-testid={`shop-cat-${cat.id}`}
            style={{ ["--cat-accent" as string]: cat.accent, ["--cat-soft" as string]: cat.soft }}
            onClick={() => onCategory(cat.id)}
            onMouseEnter={() => playHover()}
          >
            <span className="shop-cat-icon">
              <cat.Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.75} />
            </span>
            <span className="shop-cat-copy">
              <span className="shop-cat-name">{t(cat.titleKey)}</span>
              <span className="shop-cat-sub">{t(cat.subtitleKey)}</span>
            </span>
            <ArrowRight className="shop-cat-arrow w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="shop-hub-tools">
        <ToolBtn icon={Wallet} label={t("shop.tool.addPoints")} dataTestId="shop-tool-add-points" onClick={onPoints} />
        <ToolBtn icon={Download} label={t("shop.tool.downloads")} dataTestId="shop-tool-downloads" onClick={onDownloads} />
        <ToolBtn icon={HelpCircle} label={t("shop.tool.guide")} dataTestId="shop-tool-guide" onClick={onGuide} />
        <ToolBtn icon={History} label={t("shop.tool.activity")} dataTestId="shop-tool-activity" onClick={onPoints} />
      </div>
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  dataTestId,
  onClick,
}: {
  icon: typeof Wallet;
  label: string;
  dataTestId: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="shop-tool" data-testid={dataTestId} onClick={onClick} onMouseEnter={() => playHover()}>
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
    <div className="shop-panel-view" data-testid="shop-catalog">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">{t(meta.titleKey)}</div>
            <h2 className="shop-panel-title">{t("shop.catalogTitle")}</h2>
          </div>
          <div className="shop-panel-actions">
            <button
              type="button"
              className="shop-icon-btn"
              data-testid="shop-help"
              aria-label={t("shop.help")}
              onClick={() => playSelect()}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ul className="shop-list">
          {slice.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="shop-list-row"
                data-testid={`shop-title-row-${item.id}`}
                onClick={() => onOpen(item.id)}
                onMouseEnter={() => playHover()}
              >
                <TitleThumb title={item} />
                <span className="shop-list-meta">
                  <span className="shop-list-name">
                    {t(item.nameKey)}
                    {owned.includes(item.id) && <span className="shop-owned-tag">{t("shop.owned")}</span>}
                  </span>
                  <span className="shop-list-sub">
                    {t(item.publisherKey)}
                    <span className="shop-dot">·</span>
                    {t(item.systemKey)}
                  </span>
                </span>
                <span className="shop-list-price">
                  {item.price === 0 ? t("shop.free") : t("shop.pricePoints", { price: item.price.toLocaleString() })}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" data-testid="shop-back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("shop.back")}
          </button>
          <div className="shop-foot-center">
            <span className="shop-balance">{t("shop.balance", { points: points.toLocaleString() })}</span>
            <span className="shop-page-ind">
              {page + 1}/{pages}
            </span>
          </div>
          <div className="shop-page-nav">
            <button
              type="button"
              className="shop-icon-btn"
              disabled={page <= 0}
              aria-label={t("menu.previousPage")}
              onClick={() => onPage(page - 1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="shop-icon-btn"
              disabled={page >= pages - 1}
              aria-label={t("menu.nextPage")}
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
    <div className="shop-panel-view" data-testid="shop-detail">
      <div className="shop-panel shop-detail">
        <div className="shop-detail-top">
          <TitleThumb title={title} large />
          <div className="min-w-0">
            <div className="shop-kicker">{t(title.systemKey)}</div>
            <h2 className="shop-panel-title" data-testid="shop-detail-title">
              {t(title.nameKey)}
            </h2>
            <p className="shop-detail-pub">{t(title.publisherKey)}</p>
            <p className="shop-detail-blurb">{t(title.blurbKey)}</p>
          </div>
        </div>

        <dl className="shop-facts">
          <div>
            <dt>{t("shop.fact.genre")}</dt>
            <dd>{t(title.genreKey)}</dd>
          </div>
          <div>
            <dt>{t("shop.fact.players")}</dt>
            <dd>{title.players}</dd>
          </div>
          <div>
            <dt>{t("shop.fact.rating")}</dt>
            <dd>{t(title.ratingKey)}</dd>
          </div>
          <div>
            <dt>{t("shop.fact.price")}</dt>
            <dd>
              {title.price === 0 ? t("shop.free") : t("shop.priceWiiPoints", { price: title.price.toLocaleString() })}
            </dd>
          </div>
        </dl>

        <div className="shop-detail-actions">
          <button
            type="button"
            className="shop-cta shop-cta-sm"
            data-testid="shop-download-btn"
            onClick={onDownload}
          >
            <Download className="w-4 h-4" />
            {owned ? t("shop.redownload") : title.price === 0 ? t("shop.downloadFree") : t("shop.download")}
          </button>
          <button type="button" className="shop-secondary" data-testid="shop-gift-btn" onClick={onGift}>
            <Gift className="w-4 h-4" />
            {t("shop.gift")}
          </button>
          <button type="button" className="shop-back-btn" data-testid="shop-back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("shop.back")}
          </button>
        </div>

        <div className="shop-detail-balance" data-testid="shop-detail-balance">
          {t("shop.yourBalance", { points: points.toLocaleString() })}
          {owned && (
            <span className="shop-owned-tag ml-2" data-testid="shop-owned-tag">
              {t("shop.onConsole")}
            </span>
          )}
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
    <div className="shop-panel-view" data-testid="shop-points-screen">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">{t("shop.pointsKicker")}</div>
            <h2 className="shop-panel-title" data-testid="shop-points-title">
              {t("shop.pointsTitle")}
            </h2>
          </div>
        </div>
        <p className="shop-inline-note" data-testid="shop-points-note">
          {t("shop.pointsNote", { points: points.toLocaleString() })}
        </p>
        <div className="shop-packs">
          {packs.map((n) => (
            <button
              key={n}
              type="button"
              className="shop-pack"
              data-testid={`shop-pack-${n}`}
              onClick={() => onAdd(n)}
              onMouseEnter={() => playHover()}
            >
              <Wallet className="w-5 h-5 text-wii-accent-deep" />
              <span className="font-semibold">{n.toLocaleString()}</span>
              <span className="text-xs text-wii-muted">{t("shop.pointsLabel")}</span>
            </button>
          ))}
        </div>
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" data-testid="shop-back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("shop.back")}
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
    <div className="shop-panel-view" data-testid="shop-downloads-screen">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">{t("shop.downloadsKicker")}</div>
            <h2 className="shop-panel-title">{t("shop.downloadsTitle")}</h2>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="shop-inline-note">{t("shop.noDownloads")}</p>
        ) : (
          <ul className="shop-list">
            {list.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="shop-list-row"
                  data-testid={`shop-title-row-${item.id}`}
                  onClick={() => onOpen(item.id)}
                >
                  <TitleThumb title={item} />
                  <span className="shop-list-meta">
                    <span className="shop-list-name">{t(item.nameKey)}</span>
                    <span className="shop-list-sub">{t(item.systemKey)}</span>
                  </span>
                  <span className="shop-list-price">{t("shop.freeRedownload")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" data-testid="shop-back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("shop.back")}
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
    { titleKey: "shop.guide.step1.title", descKey: "shop.guide.step1.desc" },
    { titleKey: "shop.guide.step2.title", descKey: "shop.guide.step2.desc" },
    { titleKey: "shop.guide.step3.title", descKey: "shop.guide.step3.desc" },
    { titleKey: "shop.guide.step4.title", descKey: "shop.guide.step4.desc" },
    { titleKey: "shop.guide.step5.title", descKey: "shop.guide.step5.desc" },
  ];
  return (
    <div className="shop-panel-view" data-testid="shop-guide-screen">
      <div className="shop-panel">
        <div className="shop-panel-head">
          <div>
            <div className="shop-kicker">{t("shop.guideKicker")}</div>
            <h2 className="shop-panel-title">{t("shop.guideTitle")}</h2>
          </div>
        </div>
        <ol className="shop-guide">
          {steps.map((s, i) => (
            <li key={s.titleKey}>
              <span className="shop-guide-num">{i + 1}</span>
              <span>
                <span className="font-semibold text-wii-fg block">{t(s.titleKey)}</span>
                <span className="text-sm text-wii-muted">{t(s.descKey)}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="shop-panel-foot">
          <button type="button" className="shop-back-btn" data-testid="shop-back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("shop.back")}
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

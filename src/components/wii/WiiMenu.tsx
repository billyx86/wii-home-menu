import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, HardDrive, Settings2 } from "lucide-react";
import {
  getWiiMuted,
  getWiiVolume,
  playBack,
  playBoot,
  playHover,
  playOpen,
  playPage,
  playSelect,
  setWiiMuted,
  setWiiVolume,
} from "./audio";
import { CHANNEL_PAGES, PAGE_COUNT, type ChannelDef } from "./channels";
import { ChannelModal } from "./ChannelModal";
import { ChannelScreen } from "./ChannelScreen";
import { ChannelTile } from "./ChannelTile";
import { findChannelById, getSavedMenuState, persistMenuState } from "./menuState";
import { WiiClock } from "./Clock";
import { SettingsPanel } from "./SettingsPanel";
import { WiiPointer } from "./WiiPointer";

const COLS = 4;
const ROWS = 3;

// Module-level memo so the three useState initializers below share one
// localStorage read per page load.
let savedMenu: ReturnType<typeof getSavedMenuState> | null = null;
function initialMenuState() {
  if (!savedMenu) savedMenu = getSavedMenuState();
  return savedMenu;
}

export function WiiMenu() {
  // Restore page/focus from localStorage (#10). The stage is still invisible
  // while `booted` is false, so the jump happens off-screen — no flash.
  const [page, setPage] = useState(() => initialMenuState().page);
  const [focusIndex, setFocusIndex] = useState(() => initialMenuState().focusIndex);
  const [selected, setSelected] = useState<ChannelDef | null>(null);
  const [running, setRunning] = useState<ChannelDef | null>(null);
  // A channel that was open last session is re-opened only AFTER the boot
  // fade-in, so the stage is visible first.
  const [deferredOpen, setDeferredOpen] = useState<ChannelDef | null>(() => {
    const open = initialMenuState().open;
    return open ? (findChannelById(open.channelId) ?? null) : null;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sdOpen, setSdOpen] = useState(false);
  const [volume, setVolume] = useState(getWiiVolume);
  const [muted, setMuted] = useState(getWiiMuted);
  const [booted, setBooted] = useState(false);
  const lastHoverRef = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const pageChannels = CHANNEL_PAGES[page] ?? CHANNEL_PAGES[0];

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBooted(true);
      playBoot();
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  // Re-open a channel that was open last session, once the stage is visible.
  // Skips the open sound — the boot jingle already plays for it.
  useEffect(() => {
    if (!booted || !deferredOpen) return;
    setDeferredOpen(null);
    if (initialMenuState().open?.mode === "screen") setRunning(deferredOpen);
    else setSelected(deferredOpen);
  }, [booted, deferredOpen]);

  const openChannel = useCallback((ch: ChannelDef) => {
    playSelect();
    setSelected(ch);
  }, []);

  const closeModal = useCallback(() => {
    playBack();
    setSelected(null);
  }, []);

  // Persist "where we are" (#10): page/focus plus any channel that is open
  // (info modal or running screen). Closing a channel sets `open: null`, so a
  // reload lands on the plain menu — never resurrects a closed channel.
  useEffect(() => {
    persistMenuState({
      page,
      focusIndex,
      open: selected
        ? { mode: "modal", channelId: selected.id }
        : running
          ? { mode: "screen", channelId: running.id }
          : null,
    });
  }, [page, focusIndex, selected, running]);

  // A11y (#9): DOM focus follows the highlighted tile while the menu is the
  // active surface (no modal/screen/settings open). Guards skip the move when
  // focus already sits on the target (e.g. after a tile click) or when the
  // document focus is elsewhere on purpose.
  useEffect(() => {
    if (selected || running || settingsOpen || sdOpen) return;
    const tile = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-channel-id="${pageChannels[focusIndex]?.id ?? "__none__"}"]`,
    );
    if (tile && document.activeElement !== tile) tile.focus();
  }, [page, focusIndex, selected, running, settingsOpen, sdOpen, pageChannels]);

  const startChannel = useCallback(() => {
    if (!selected || selected.kind === "empty") return;
    playOpen();
    setRunning(selected);
    setSelected(null);
  }, [selected]);

  const exitChannel = useCallback(() => {
    playBack();
    setRunning(null);
  }, []);

  const changePage = useCallback(
    (next: number) => {
      if (next < 0 || next >= PAGE_COUNT || next === page) return;
      playPage();
      setPage(next);
      setFocusIndex(0);
      lastHoverRef.current = null;
    },
    [page],
  );

  const hoverSound = useCallback((id: string) => {
    if (lastHoverRef.current === id) return;
    lastHoverRef.current = id;
    playHover();
  }, []);

  useEffect(() => {
    if (selected || running || settingsOpen || sdOpen) return;

    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      // The handler closure always holds the current focusIndex / page /
      // pageChannels (the effect resubscribes when any of them change, see
      // the deps below), so the next focus position is computed HERE — all
      // side effects (page-turn + hover sounds, nested setFocusIndex inside
      // changePage) stay OUT of the setFocusIndex updater, which React may
      // invoke twice to verify purity.
      if (key === "ArrowRight") {
        e.preventDefault();
        const next = focusIndex + 1;
        if (next >= COLS * ROWS) {
          if (page < PAGE_COUNT - 1) changePage(page + 1);
          return;
        }
        const ch = pageChannels[next];
        if (ch) hoverSound(ch.id);
        setFocusIndex(next);
      } else if (key === "ArrowLeft") {
        e.preventDefault();
        const next = focusIndex - 1;
        if (next < 0) {
          if (page > 0) {
            changePage(page - 1);
            // Land on the right edge of the previous page, like the real menu
            // (changePage resets focus to 0; this second, later update wins).
            setFocusIndex(COLS * ROWS - 1);
          }
          return;
        }
        const ch = pageChannels[next];
        if (ch) hoverSound(ch.id);
        setFocusIndex(next);
      } else if (key === "ArrowDown") {
        e.preventDefault();
        const next = focusIndex + COLS;
        if (next >= COLS * ROWS) return;
        const ch = pageChannels[next];
        if (ch) hoverSound(ch.id);
        setFocusIndex(next);
      } else if (key === "ArrowUp") {
        e.preventDefault();
        const next = focusIndex - COLS;
        if (next < 0) return;
        const ch = pageChannels[next];
        if (ch) hoverSound(ch.id);
        setFocusIndex(next);
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        const ch = pageChannels[focusIndex];
        if (ch) openChannel(ch);
      } else if (key === "[" || key === "PageUp") {
        e.preventDefault();
        changePage(page - 1);
      } else if (key === "]" || key === "PageDown") {
        e.preventDefault();
        changePage(page + 1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selected,
    running,
    settingsOpen,
    sdOpen,
    page,
    pageChannels,
    focusIndex,
    changePage,
    hoverSound,
    openChannel,
  ]);

  return (
    <div className="wii-stage" data-pointer="custom">
      <div className="wii-orb wii-orb-a" />
      <div className="wii-orb wii-orb-b" />
      <div className="wii-orb wii-orb-c" />

      <WiiPointer enabled={!running} />

      <div
        className={`relative z-10 flex flex-col min-h-dvh transition-opacity duration-500 ${booted ? "opacity-100" : "opacity-0"}`}
      >
        <header className="flex items-center justify-between px-3 sm:px-8 pt-3 sm:pt-5 pb-1 sm:pb-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-white to-wii-bg-soft shadow-[0_2px_8px_rgb(70_90_120/0.16),inset_0_0_0_1.5px_rgb(160_172_188/0.45)] flex items-center justify-center"
              aria-hidden
            >
              <span className="text-[0.7rem] sm:text-xs font-bold tracking-tight text-wii-accent-deep">
                Wii
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-wii-fg">Home Menu</div>
              <div className="text-[0.7rem] text-wii-muted">
                Page {page + 1} of {PAGE_COUNT}
              </div>
            </div>
          </div>
          <WiiClock />
        </header>

        <div className="flex-1 flex items-center px-0.5 sm:px-4 lg:px-8 py-1 sm:py-4 min-h-0">
          <button
            type="button"
            className="wii-page-btn shrink-0"
            disabled={page <= 0}
            aria-label="Previous page"
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex-1 min-w-0 px-1.5 sm:px-5 lg:px-8">
            <div
              ref={gridRef}
              className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 max-w-4xl mx-auto"
              role="listbox"
              aria-label="Channel grid"
            >
              {pageChannels.map((ch, i) => (
                <div key={ch.id} role="presentation">
                  <ChannelTile
                    channel={ch}
                    focused={focusIndex === i && !selected && !running && !settingsOpen && !sdOpen}
                    tabIndex={
                      focusIndex === i && !selected && !running && !settingsOpen && !sdOpen ? 0 : -1
                    }
                    onFocus={() => setFocusIndex(i)}
                    onOpen={() => openChannel(ch)}
                    onHoverSound={() => hoverSound(ch.id)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-3 sm:mt-5">
              {Array.from({ length: PAGE_COUNT }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="wii-dot"
                  data-active={page === i ? "true" : "false"}
                  aria-label={`Go to page ${i + 1}`}
                  aria-current={page === i ? "page" : undefined}
                  onClick={() => changePage(i)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="wii-page-btn shrink-0"
            disabled={page >= PAGE_COUNT - 1}
            aria-label="Next page"
            onClick={() => changePage(page + 1)}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <footer className="px-2 sm:px-6 pb-0">
          <div className="wii-bottom-bar max-w-4xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                className="wii-bar-btn"
                data-active={settingsOpen ? "true" : "false"}
                onClick={() => {
                  playSelect();
                  setSettingsOpen(true);
                }}
              >
                <Settings2 className="w-4 h-4 text-wii-accent-deep" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="wii-bar-btn"
                data-active={sdOpen ? "true" : "false"}
                onClick={() => {
                  playSelect();
                  setSdOpen(true);
                }}
              >
                <HardDrive className="w-4 h-4 text-wii-accent-deep" />
                <span>SD Card</span>
              </button>
            </div>
            <div className="hidden md:block text-xs text-wii-muted font-medium shrink-0">
              Arrows move · Enter opens · [ ] pages
            </div>
          </div>
        </footer>
      </div>

      {selected && <ChannelModal channel={selected} onLaunch={startChannel} onClose={closeModal} />}

      {running && <ChannelScreen channel={running} onExit={exitChannel} />}

      <SettingsPanel
        open={settingsOpen}
        volume={volume}
        muted={muted}
        onVolume={(v) => {
          setVolume(v);
          setWiiVolume(v);
        }}
        onMuted={(m) => {
          setMuted(m);
          setWiiMuted(m);
        }}
        onClose={() => {
          playBack();
          setSettingsOpen(false);
        }}
      />

      {sdOpen && (
        <div
          className="wii-modal-backdrop flex items-center justify-center p-4"
          onClick={() => {
            playBack();
            setSdOpen(false);
          }}
        >
          <div
            className="wii-modal max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sd-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-wii-bg-soft flex items-center justify-center mb-4 border border-wii-tile-edge/40">
                <HardDrive className="w-8 h-8 text-wii-accent-deep" />
              </div>
              <h2 id="sd-title" className="text-xl font-semibold">
                SD Card
              </h2>
              <p className="mt-2 text-sm text-wii-muted leading-relaxed">
                No SD Card inserted. Save data, photos, and channel backups would appear here.
              </p>
              <button
                type="button"
                className="wii-primary-btn mt-6 w-full"
                onClick={() => {
                  playBack();
                  setSdOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

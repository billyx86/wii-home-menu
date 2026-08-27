import { ChannelArt } from "./ChannelArt";
import type { ChannelDef } from "./channels";

type Props = {
  channel: ChannelDef;
  focused: boolean;
  /** Roving tabindex: 0 on the highlighted tile, -1 on all others. */
  tabIndex: number;
  onFocus: () => void;
  onOpen: () => void;
  onHoverSound: () => void;
};

/**
 * One channel slot.
 *
 * A11y (#9): the tile is an `option` inside the menu's `listbox` (the grid).
 * The roving tabindex is passed in from WiiMenu — only the highlighted tile is
 * a tab stop, so Tab enters/leaves the grid as one widget while arrow keys
 * move between options. `aria-selected` mirrors the menu's highlight so
 * screen readers announce "selected / not selected".
 */
export function ChannelTile({ channel, focused, tabIndex, onFocus, onOpen, onHoverSound }: Props) {
  const empty = channel.kind === "empty";

  return (
    <button
      type="button"
      role="option"
      aria-selected={focused}
      tabIndex={tabIndex}
      aria-label={empty ? `Empty channel slot ${channel.id}` : channel.name}
      className={`wii-tile aspect-[4/3] w-full ${empty ? "wii-tile-empty" : ""} ${channel.kind === "disc" ? "wii-tile-disc" : ""}`}
      data-focused={focused ? "true" : "false"}
      data-channel-id={channel.id}
      onMouseEnter={() => {
        onFocus();
        if (!empty) onHoverSound();
      }}
      onFocus={onFocus}
      onClick={onOpen}
    >
      <div className="wii-tile-face">
        {empty ? (
          <div className="w-full h-full flex items-center justify-center opacity-40">
            <div className="w-[42%] aspect-square rounded-xl border-2 border-dashed border-wii-subtle/60" />
          </div>
        ) : (
          <>
            <ChannelArt
              kind={channel.kind}
              accent={channel.accent}
              accentSoft={channel.accentSoft}
              spinning={channel.kind === "disc" && focused}
            />
            <span className="wii-tile-label">{channel.name}</span>
          </>
        )}
      </div>
    </button>
  );
}

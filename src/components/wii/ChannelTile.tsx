import { ChannelArt } from "./ChannelArt";
import type { ChannelDef } from "./channels";

type Props = {
  channel: ChannelDef;
  focused: boolean;
  onFocus: () => void;
  onOpen: () => void;
  onHoverSound: () => void;
};

export function ChannelTile({ channel, focused, onFocus, onOpen, onHoverSound }: Props) {
  const empty = channel.kind === "empty";

  return (
    <button
      type="button"
      className={`wii-tile aspect-[4/3] w-full ${empty ? "wii-tile-empty" : ""} ${channel.kind === "disc" ? "wii-tile-disc" : ""}`}
      data-focused={focused ? "true" : "false"}
      aria-label={empty ? "Empty channel slot" : channel.name}
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

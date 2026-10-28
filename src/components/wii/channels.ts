export type ChannelKind =
  | "disc"
  | "mii"
  | "photo"
  | "news"
  | "forecast"
  | "shop"
  | "internet"
  | "votes"
  | "message"
  | "calendar"
  | "checkmii"
  | "homebrew"
  | "empty";

/**
 * A channel slot's metadata.
 *
 * Display copy lives in the i18n message maps (`src/lib/i18n`) and is
 * resolved at render time via `t()` — these fields hold message KEYS, not
 * translated strings, so adding a locale never touches this data file.
 * Key convention: `channel.<id>.name|subtitle|description`.
 */
export type ChannelDef = {
  id: string;
  kind: ChannelKind;
  /** i18n key resolving to the channel's display name. */
  nameKey: string;
  /** i18n key resolving to the tile/screen subtitle. */
  subtitleKey: string;
  /** i18n key resolving to the modal/screen description. */
  descriptionKey: string;
  accent: string;
  accentSoft: string;
};

/** Page 0–2, 12 slots each (4×3). Empty slots use kind "empty". */
export const CHANNEL_PAGES: ChannelDef[][] = [
  [
    {
      id: "disc",
      kind: "disc",
      nameKey: "channel.disc.name",
      subtitleKey: "channel.disc.subtitle",
      descriptionKey: "channel.disc.description",
      accent: "#5a6a80",
      accentSoft: "#d8e0ea",
    },
    {
      id: "mii",
      kind: "mii",
      nameKey: "channel.mii.name",
      subtitleKey: "channel.mii.subtitle",
      descriptionKey: "channel.mii.description",
      accent: "#e8a33a",
      accentSoft: "#fff0d4",
    },
    {
      id: "photo",
      kind: "photo",
      nameKey: "channel.photo.name",
      subtitleKey: "channel.photo.subtitle",
      descriptionKey: "channel.photo.description",
      accent: "#4caf82",
      accentSoft: "#d9f5e8",
    },
    {
      id: "news",
      kind: "news",
      nameKey: "channel.news.name",
      subtitleKey: "channel.news.subtitle",
      descriptionKey: "channel.news.description",
      accent: "#3a7fd4",
      accentSoft: "#dcecfb",
    },
    {
      id: "forecast",
      kind: "forecast",
      nameKey: "channel.forecast.name",
      subtitleKey: "channel.forecast.subtitle",
      descriptionKey: "channel.forecast.description",
      accent: "#39a7d4",
      accentSoft: "#d8f2fb",
    },
    {
      id: "shop",
      kind: "shop",
      nameKey: "channel.shop.name",
      subtitleKey: "channel.shop.subtitle",
      descriptionKey: "channel.shop.description",
      accent: "#d45a8a",
      accentSoft: "#fce0ec",
    },
    {
      id: "internet",
      kind: "internet",
      nameKey: "channel.internet.name",
      subtitleKey: "channel.internet.subtitle",
      descriptionKey: "channel.internet.description",
      accent: "#5b6fd4",
      accentSoft: "#e0e4fb",
    },
    {
      id: "votes",
      kind: "votes",
      nameKey: "channel.votes.name",
      subtitleKey: "channel.votes.subtitle",
      descriptionKey: "channel.votes.description",
      accent: "#7a5fd4",
      accentSoft: "#e8e0fb",
    },
    {
      id: "message",
      kind: "message",
      nameKey: "channel.message.name",
      subtitleKey: "channel.message.subtitle",
      descriptionKey: "channel.message.description",
      accent: "#c46a3a",
      accentSoft: "#fce8d8",
    },
    {
      id: "calendar",
      kind: "calendar",
      nameKey: "channel.calendar.name",
      subtitleKey: "channel.calendar.subtitle",
      descriptionKey: "channel.calendar.description",
      accent: "#3a9a7a",
      accentSoft: "#d8f5ea",
    },
    {
      id: "checkmii",
      kind: "checkmii",
      nameKey: "channel.checkmii.name",
      subtitleKey: "channel.checkmii.subtitle",
      descriptionKey: "channel.checkmii.description",
      accent: "#d48a3a",
      accentSoft: "#fcebd4",
    },
    {
      id: "homebrew",
      kind: "homebrew",
      nameKey: "channel.homebrew.name",
      subtitleKey: "channel.homebrew.subtitle",
      descriptionKey: "channel.homebrew.description",
      accent: "#3a8a4a",
      accentSoft: "#d8f0dc",
    },
  ],
  [
    {
      id: "p2-1",
      kind: "photo",
      nameKey: "channel.p2-1.name",
      subtitleKey: "channel.p2-1.subtitle",
      descriptionKey: "channel.p2-1.description",
      accent: "#4caf82",
      accentSoft: "#d9f5e8",
    },
    {
      id: "p2-2",
      kind: "news",
      nameKey: "channel.p2-2.name",
      subtitleKey: "channel.p2-2.subtitle",
      descriptionKey: "channel.p2-2.description",
      accent: "#2f8f5a",
      accentSoft: "#d8f5e4",
    },
    {
      id: "p2-3",
      kind: "forecast",
      nameKey: "channel.p2-3.name",
      subtitleKey: "channel.p2-3.subtitle",
      descriptionKey: "channel.p2-3.description",
      accent: "#39a7d4",
      accentSoft: "#d8f2fb",
    },
    {
      id: "p2-4",
      kind: "shop",
      nameKey: "channel.p2-4.name",
      subtitleKey: "channel.p2-4.subtitle",
      descriptionKey: "channel.p2-4.description",
      accent: "#d45a8a",
      accentSoft: "#fce0ec",
    },
    {
      id: "p2-5",
      kind: "internet",
      nameKey: "channel.p2-5.name",
      subtitleKey: "channel.p2-5.subtitle",
      descriptionKey: "channel.p2-5.description",
      accent: "#5b6fd4",
      accentSoft: "#e0e4fb",
    },
    {
      id: "p2-6",
      kind: "mii",
      nameKey: "channel.p2-6.name",
      subtitleKey: "channel.p2-6.subtitle",
      descriptionKey: "channel.p2-6.description",
      accent: "#e8a33a",
      accentSoft: "#fff0d4",
    },
    emptySlot("p2-e1"),
    emptySlot("p2-e2"),
    emptySlot("p2-e3"),
    emptySlot("p2-e4"),
    emptySlot("p2-e5"),
    emptySlot("p2-e6"),
  ],
  [
    emptySlot("p3-e1"),
    emptySlot("p3-e2"),
    emptySlot("p3-e3"),
    emptySlot("p3-e4"),
    emptySlot("p3-e5"),
    emptySlot("p3-e6"),
    emptySlot("p3-e7"),
    emptySlot("p3-e8"),
    emptySlot("p3-e9"),
    emptySlot("p3-e10"),
    emptySlot("p3-e11"),
    emptySlot("p3-e12"),
  ],
];

function emptySlot(id: string): ChannelDef {
  return {
    id,
    kind: "empty",
    nameKey: "channel.empty.name",
    subtitleKey: "channel.empty.subtitle",
    descriptionKey: "channel.empty.description",
    accent: "#9aa3b2",
    accentSoft: "#e8ecf1",
  };
}

export const PAGE_COUNT = CHANNEL_PAGES.length;

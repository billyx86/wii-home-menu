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

export type ChannelDef = {
  id: string;
  kind: ChannelKind;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  accentSoft: string;
};

/** Page 0–2, 12 slots each (4×3). Empty slots use kind "empty". */
export const CHANNEL_PAGES: ChannelDef[][] = [
  [
    {
      id: "disc",
      kind: "disc",
      name: "Disc Channel",
      subtitle: "Insert a disc",
      description:
        "Start software from a disc. When no disc is inserted, this channel waits patiently for your next adventure.",
      accent: "#5a6a80",
      accentSoft: "#d8e0ea",
    },
    {
      id: "mii",
      kind: "mii",
      name: "Mii Channel",
      subtitle: "Create & share",
      description:
        "Create cartoon avatars, parade them around, and keep a lively plaza of friends on your console.",
      accent: "#e8a33a",
      accentSoft: "#fff0d4",
    },
    {
      id: "photo",
      kind: "photo",
      name: "Photo Channel",
      subtitle: "Memories",
      description:
        "Browse albums, zoom into snapshots, and flip through photos with soft page-turn transitions.",
      accent: "#4caf82",
      accentSoft: "#d9f5e8",
    },
    {
      id: "news",
      kind: "news",
      name: "News Channel",
      subtitle: "Headlines",
      description:
        "Catch up on world headlines, regional stories, and a quiet ticker of the day's top items.",
      accent: "#3a7fd4",
      accentSoft: "#dcecfb",
    },
    {
      id: "forecast",
      kind: "forecast",
      name: "Forecast Channel",
      subtitle: "Weather",
      description:
        "Check local skies, multi-day outlooks, and a gentle globe of worldwide weather at a glance.",
      accent: "#39a7d4",
      accentSoft: "#d8f2fb",
    },
    {
      id: "shop",
      kind: "shop",
      name: "Shop Channel",
      subtitle: "Browse titles",
      description:
        "Discover demos, classics, and downloadable software in a bright boutique of digital shelves.",
      accent: "#d45a8a",
      accentSoft: "#fce0ec",
    },
    {
      id: "internet",
      kind: "internet",
      name: "Internet Channel",
      subtitle: "Browse the web",
      description:
        "Surf the web with a full-screen browser tailored for the living-room controller experience.",
      accent: "#5b6fd4",
      accentSoft: "#e0e4fb",
    },
    {
      id: "votes",
      kind: "votes",
      name: "Votes Channel",
      subtitle: "What do you think?",
      description:
        "Answer daily polls, see how others voted, and watch the world tally opinions in real time.",
      accent: "#7a5fd4",
      accentSoft: "#e8e0fb",
    },
    {
      id: "message",
      kind: "message",
      name: "Message Board",
      subtitle: "Notes & calendar",
      description:
        "Leave notes on the calendar, send messages to friends, and keep track of console events.",
      accent: "#c46a3a",
      accentSoft: "#fce8d8",
    },
    {
      id: "calendar",
      kind: "calendar",
      name: "Today",
      subtitle: "Date & events",
      description:
        "See today's date, upcoming reminders, and soft seasonal decorations on your board.",
      accent: "#3a9a7a",
      accentSoft: "#d8f5ea",
    },
    {
      id: "checkmii",
      kind: "checkmii",
      name: "Check Mii Out",
      subtitle: "Plaza posts",
      description:
        "Browse popular Miis from around the world and post your own creations for others to find.",
      accent: "#d48a3a",
      accentSoft: "#fcebd4",
    },
    {
      id: "homebrew",
      kind: "homebrew",
      name: "Home Channel",
      subtitle: "Extras",
      description:
        "A friendly hub for demos, tools, and custom experiences living on your menu.",
      accent: "#3a8a4a",
      accentSoft: "#d8f0dc",
    },
  ],
  [
    {
      id: "p2-1",
      kind: "photo",
      name: "Album B",
      subtitle: "More photos",
      description: "A second photo shelf for backup albums and shared SD card pictures.",
      accent: "#4caf82",
      accentSoft: "#d9f5e8",
    },
    {
      id: "p2-2",
      kind: "news",
      name: "Sports Feed",
      subtitle: "Scores",
      description: "Quick scores and sports headlines from around the globe.",
      accent: "#2f8f5a",
      accentSoft: "#d8f5e4",
    },
    {
      id: "p2-3",
      kind: "forecast",
      name: "Sky Watch",
      subtitle: "Hourly",
      description: "Hour-by-hour conditions with gentle icons for sun, cloud, and rain.",
      accent: "#39a7d4",
      accentSoft: "#d8f2fb",
    },
    {
      id: "p2-4",
      kind: "shop",
      name: "Classics",
      subtitle: "Virtual titles",
      description: "A quiet aisle of classic software ready to download and play.",
      accent: "#d45a8a",
      accentSoft: "#fce0ec",
    },
    {
      id: "p2-5",
      kind: "internet",
      name: "Bookmarks",
      subtitle: "Saved pages",
      description: "Your favorite pages, pinned for one-click living-room browsing.",
      accent: "#5b6fd4",
      accentSoft: "#e0e4fb",
    },
    {
      id: "p2-6",
      kind: "mii",
      name: "Mii Parade",
      subtitle: "Watch them walk",
      description: "A looping parade of Miis strolling across a soft plaza stage.",
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
    name: "",
    subtitle: "Empty slot",
    description: "This channel slot is empty. Download software or rearrange channels to fill it.",
    accent: "#9aa3b2",
    accentSoft: "#e8ecf1",
  };
}

export const PAGE_COUNT = CHANNEL_PAGES.length;

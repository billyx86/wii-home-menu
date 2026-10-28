/**
 * English message map — the reference locale for the i18n layer (#18).
 *
 * Every user-visible string in the Home Menu, channel screens, and Shop
 * Channel resolves through `t()` (see `./index.ts`) from this map.
 *
 * To add a locale:
 *   1. Copy this file to e.g. `de.ts` and translate the values.
 *   2. Register it in `./index.ts` (`REGISTRY` + the `Locale` union).
 *   3. Call `useI18n.getState().setLocale("de")` (or wire a picker).
 * No component changes are required.
 *
 * Conventions:
 * - Keys are dot-namespaced by surface: `menu.*`, `settings.*`, `shop.*`,
 *   `channel.*`. Channel metadata uses `channel.<id>.name|subtitle|description`
 *   (resolved via the `nameKey`/`subtitleKey`/`descriptionKey` fields in
 *   `components/wii/channels.ts`); shop catalog data uses
 *   `shop.title.<id>.<field>` keys.
 * - `{placeholder}` marks interpolation points filled by `t(key, vars)`.
 * - Brand marks (the "Wii" wordmark, the SVG bag logo) and console hardware
 *   names are deliberately kept verbatim in components, not in the map.
 */
export const en: Record<string, string> = {
  // ---- Home Menu chrome -------------------------------------------------
  "menu.homeTitle": "Home Menu",
  "menu.pageOf": "Page {current} of {total}",
  "menu.channelGrid": "Channel grid",
  "menu.goToPage": "Go to page {page}",
  "menu.previousPage": "Previous page",
  "menu.nextPage": "Next page",
  "menu.settings": "Settings",
  "menu.sdCard": "SD Card",
  "menu.controlsHint": "Arrows move · Enter opens · [ ] pages",
  "menu.sdTitle": "SD Card",
  "menu.sdEmpty": "No SD Card inserted. Save data, photos, and channel backups would appear here.",
  "menu.close": "Close",

  // ---- Channel tiles -----------------------------------------------------
  "tile.emptySlot": "Empty channel slot {id}",

  // ---- Channel modal -----------------------------------------------------
  "modal.channel": "Channel: {name}",
  "modal.start": "Start",
  "modal.back": "Back",

  // ---- Channel screen shell ----------------------------------------------
  "channel.wiiMenu": "Wii Menu",
  "channel.exitToMenu": "Return to Wii Menu",

  // ---- Disc channel body ---------------------------------------------------
  "channel.disc.insert": "Please insert a disc",
  "channel.disc.insertBody":
    "When a disc is ready, it will appear here with cover art and a Start button — just like the living-room console experience.",
  "channel.disc.tipBefore": "Tip: Press",
  "channel.disc.tipAfter": "or use Wii Menu to return.",

  // ---- Mii channel body ----------------------------------------------------
  "channel.mii.plazaOpen": "Plaza open",
  "channel.mii.title": "Mii Plaza",
  "channel.mii.sub": "A friendly gathering of faces on parade.",

  // ---- Photo channel body --------------------------------------------------
  "channel.photo.title": "Photo Album",
  "channel.photo.sub": "Flip through soft memory tiles — no SD card required.",
  "channel.photo.p1": "Sunset pier",
  "channel.photo.p2": "Mountain lake",
  "channel.photo.p3": "City lights",
  "channel.photo.p4": "Garden path",
  "channel.photo.p5": "Snow day",
  "channel.photo.p6": "Beach walk",

  // ---- News channel body ----------------------------------------------------
  "channel.news.title": "Today's Headlines",
  "channel.news.sub": "A calm feed of sample stories for your living room.",
  "channel.news.region.world": "World",
  "channel.news.region.science": "Science",
  "channel.news.region.culture": "Culture",
  "channel.news.region.sports": "Sports",
  "channel.news.h1": "Clear skies expected across coastal regions this week",
  "channel.news.h2": "New telescope captures first light of a distant nebula",
  "channel.news.h3": "Local festival draws record crowds to the plaza",
  "channel.news.h4": "Underdogs clinch the final in a last-minute finish",

  // ---- Forecast channel body -------------------------------------------------
  "channel.forecast.title": "Local Forecast",
  "channel.forecast.sub": "Sample weather for a gentle afternoon.",
  "channel.forecast.mon": "Mon",
  "channel.forecast.tue": "Tue",
  "channel.forecast.wed": "Wed",
  "channel.forecast.thu": "Thu",
  "channel.forecast.fri": "Fri",
  "channel.forecast.current": "Partly cloudy",
  "channel.forecast.feels": "Feels like 20° · Light breeze",
  "channel.forecast.sunny": "Sunny",
  "channel.forecast.clouds": "Clouds",
  "channel.forecast.showers": "Showers",
  "channel.forecast.clear": "Clear",
  "channel.forecast.breezy": "Breezy",

  // ---- Internet channel body --------------------------------------------------
  "channel.internet.title": "Internet Channel",
  "channel.internet.sub": "A living-room browser frame — demo only.",
  "channel.internet.hello": "Hello from the web",
  "channel.internet.helloSub": "Bookmarks, zoom, and soft page loads — imagined for the couch.",

  // ---- Votes channel body -------------------------------------------------------
  "channel.votes.title": "Everybody Votes",
  "channel.votes.sub": "Which snack wins movie night?",
  "channel.votes.popcorn": "Popcorn",
  "channel.votes.cookies": "Cookies",
  "channel.votes.thanks": "Thanks for voting!",
  "channel.votes.tap": "Tap an option to cast your vote.",

  // ---- Message board body ---------------------------------------------------------
  "channel.message.sub": "Notes pinned to your calendar board.",
  "channel.message.month": "Jul",
  "channel.message.n1.title": "Game night",
  "channel.message.n1.body": "Bring controllers — rematch night.",
  "channel.message.n2.title": "Photo dump",
  "channel.message.n2.body": "Load summer album onto the SD card.",
  "channel.message.n3.title": "Shop sale",
  "channel.message.n3.body": "Check Classics aisle for demos.",

  // ---- Home channel body ------------------------------------------------------------
  "channel.home.body": "A cozy shelf for extras, tools, and experiments that live alongside your main channels.",
  "channel.home.demoHub": "Demo hub · no extra software installed",

  // ---- Settings panel -----------------------------------------------------------------
  "settings.title": "Wii Settings",
  "settings.close": "Close settings",
  "settings.sound": "Sound",
  "settings.unmute": "Unmute",
  "settings.mute": "Mute",
  "settings.volume": "Volume · {pct}%",
  "settings.controls": "Controls",
  "settings.key.arrows": "Arrow keys",
  "settings.key.arrows.desc": "move focus across channels",
  "settings.key.enter": "Enter",
  "settings.key.enter.desc": "open focused channel",
  "settings.key.esc": "Esc",
  "settings.key.esc.desc": "back / close",
  "settings.key.brackets": "[ ]",
  "settings.key.brackets.desc": "previous / next page",
  "settings.about": "About this menu",
  "settings.aboutBody":
    "A fan-made recreation of the classic living-room home menu look and feel — original channel art and layout, no console hardware required.",
  "settings.done": "Done",

  // ---- Shop: welcome + hub -------------------------------------------------------------
  "shop.title": "Wii Shop Channel",
  "shop.lead":
    "Browse classics, downloadable software, and extra channels — paid with Wii Points, ready for your Home Menu.",
  "shop.start": "Start Shopping",
  "shop.demoNote": "Demo catalog · no real purchases",
  "shop.hubTitle": "What would you like to shop for?",
  "shop.pointsLabel": "Wii Points",
  "shop.cat.virtual.title": "Virtual Console",
  "shop.cat.virtual.subtitle": "Classic systems, reborn for the living room",
  "shop.cat.wiiware.title": "WiiWare",
  "shop.cat.wiiware.subtitle": "Fresh downloads built for remote play",
  "shop.cat.channels.title": "Wii Channels",
  "shop.cat.channels.subtitle": "Extra channels for your Home Menu",
  "shop.tool.addPoints": "Add Wii Points",
  "shop.tool.downloads": "Titles You've Downloaded",
  "shop.tool.guide": "Shopping Guide",
  "shop.tool.activity": "Account Activity",

  // ---- Shop: catalog + detail -------------------------------------------------------------
  "shop.catalogTitle": "Popular Titles",
  "shop.help": "Help",
  "shop.owned": "Owned",
  "shop.free": "Free",
  "shop.pricePoints": "{price} Points",
  "shop.back": "Back",
  "shop.balance": "{points} Wii Points",
  "shop.fact.genre": "Genre",
  "shop.fact.players": "Players",
  "shop.fact.rating": "Rating",
  "shop.fact.price": "Price",
  "shop.priceWiiPoints": "{price} Wii Points",
  "shop.download": "Download",
  "shop.downloadFree": "Download Free",
  "shop.redownload": "Re-download",
  "shop.gift": "Gift",
  "shop.yourBalance": "Your balance · {points} Wii Points",
  "shop.onConsole": "On this console",

  // ---- Shop: points / downloads / guide ------------------------------------------------------
  "shop.pointsKicker": "Account",
  "shop.pointsTitle": "Add Wii Points",
  "shop.pointsNote": "Current balance: {points} Wii Points. Demo packs only — nothing is charged.",
  "shop.downloadsKicker": "Library",
  "shop.downloadsTitle": "Titles You've Downloaded",
  "shop.noDownloads": "No downloads yet. Grab something from Virtual Console or WiiWare.",
  "shop.freeRedownload": "Free re-download",
  "shop.guideKicker": "Help",
  "shop.guideTitle": "Shopping Guide",
  "shop.guide.step1.title": "Start Shopping",
  "shop.guide.step1.desc": "Enter the shop from the welcome screen to see the three main aisles.",
  "shop.guide.step2.title": "Pick a category",
  "shop.guide.step2.desc": "Virtual Console for classics, WiiWare for new downloads, Channels for menu extras.",
  "shop.guide.step3.title": "Browse the list",
  "shop.guide.step3.desc": "Each row shows cover art, publisher, system, and price in Wii Points.",
  "shop.guide.step4.title": "Download or Gift",
  "shop.guide.step4.desc": "Confirm a title to download to this console, or queue a gift for a friend.",
  "shop.guide.step5.title": "Add Points",
  "shop.guide.step5.desc": "Top up your balance anytime — in this demo, packs are free samples.",

  // ---- Shop: toasts ---------------------------------------------------------------------------
  "shop.toast.reowned": "Already on your console — re-download free.",
  "shop.toast.insufficient": "Not enough Wii Points.",
  "shop.toast.downloaded": "Downloaded · {title}",
  "shop.toast.gift": "Gift message queued for a Wii Friend (demo).",
  "shop.toast.added": "Added {points} Wii Points",

  // ---- Channel metadata (nameKey / subtitleKey / descriptionKey) ---------------------------------
  "channel.disc.name": "Disc Channel",
  "channel.disc.subtitle": "Insert a disc",
  "channel.disc.description":
    "Start software from a disc. When no disc is inserted, this channel waits patiently for your next adventure.",
  "channel.mii.name": "Mii Channel",
  "channel.mii.subtitle": "Create & share",
  "channel.mii.description":
    "Create cartoon avatars, parade them around, and keep a lively plaza of friends on your console.",
  "channel.photo.name": "Photo Channel",
  "channel.photo.subtitle": "Memories",
  "channel.photo.description":
    "Browse albums, zoom into snapshots, and flip through photos with soft page-turn transitions.",
  "channel.news.name": "News Channel",
  "channel.news.subtitle": "Headlines",
  "channel.news.description":
    "Catch up on world headlines, regional stories, and a quiet ticker of the day's top items.",
  "channel.forecast.name": "Forecast Channel",
  "channel.forecast.subtitle": "Weather",
  "channel.forecast.description":
    "Check local skies, multi-day outlooks, and a gentle globe of worldwide weather at a glance.",
  "channel.shop.name": "Shop Channel",
  "channel.shop.subtitle": "Browse titles",
  "channel.shop.description":
    "Discover demos, classics, and downloadable software in a bright boutique of digital shelves.",
  "channel.internet.name": "Internet Channel",
  "channel.internet.subtitle": "Browse the web",
  "channel.internet.description":
    "Surf the web with a full-screen browser tailored for the living-room controller experience.",
  "channel.votes.name": "Votes Channel",
  "channel.votes.subtitle": "What do you think?",
  "channel.votes.description":
    "Answer daily polls, see how others voted, and watch the world tally opinions in real time.",
  "channel.message.name": "Message Board",
  "channel.message.subtitle": "Notes & calendar",
  "channel.message.description":
    "Leave notes on the calendar, send messages to friends, and keep track of console events.",
  "channel.calendar.name": "Today",
  "channel.calendar.subtitle": "Date & events",
  "channel.calendar.description":
    "See today's date, upcoming reminders, and soft seasonal decorations on your board.",
  "channel.checkmii.name": "Check Mii Out",
  "channel.checkmii.subtitle": "Plaza posts",
  "channel.checkmii.description":
    "Browse popular Miis from around the world and post your own creations for others to find.",
  "channel.homebrew.name": "Home Channel",
  "channel.homebrew.subtitle": "Extras",
  "channel.homebrew.description":
    "A friendly hub for demos, tools, and custom experiences living on your menu.",
  "channel.p2-1.name": "Album B",
  "channel.p2-1.subtitle": "More photos",
  "channel.p2-1.description": "A second photo shelf for backup albums and shared SD card pictures.",
  "channel.p2-2.name": "Sports Feed",
  "channel.p2-2.subtitle": "Scores",
  "channel.p2-2.description": "Quick scores and sports headlines from around the globe.",
  "channel.p2-3.name": "Sky Watch",
  "channel.p2-3.subtitle": "Hourly",
  "channel.p2-3.description": "Hour-by-hour conditions with gentle icons for sun, cloud, and rain.",
  "channel.p2-4.name": "Classics",
  "channel.p2-4.subtitle": "Virtual titles",
  "channel.p2-4.description": "A quiet aisle of classic software ready to download and play.",
  "channel.p2-5.name": "Bookmarks",
  "channel.p2-5.subtitle": "Saved pages",
  "channel.p2-5.description": "Your favorite pages, pinned for one-click living-room browsing.",
  "channel.p2-6.name": "Mii Parade",
  "channel.p2-6.subtitle": "Watch them walk",
  "channel.p2-6.description": "A looping parade of Miis strolling across a soft plaza stage.",
  "channel.empty.name": "",
  "channel.empty.subtitle": "Empty slot",
  "channel.empty.description": "This channel slot is empty. Download software or rearrange channels to fill it.",

  // ---- Shop catalog data (nameKey / publisherKey / systemKey / genreKey / ratingKey / blurbKey) ---
  "shop.title.vc-meadow.name": "Meadow Knight",
  "shop.title.vc-meadow.publisher": "Pixel Grove",
  "shop.title.vc-meadow.system": "8-bit Classics",
  "shop.title.vc-meadow.genre": "Action",
  "shop.title.vc-meadow.rating": "Everyone",
  "shop.title.vc-meadow.blurb": "A side-scrolling quest through sunlit fields and castle halls.",
  "shop.title.vc-orbit.name": "Orbit Patrol",
  "shop.title.vc-orbit.publisher": "Starbit Soft",
  "shop.title.vc-orbit.system": "16-bit Classics",
  "shop.title.vc-orbit.genre": "Shooter",
  "shop.title.vc-orbit.rating": "Everyone 10+",
  "shop.title.vc-orbit.blurb": "Pilot a tiny ship through neon asteroid belts and boss stations.",
  "shop.title.vc-harbor.name": "Harbor Dash",
  "shop.title.vc-harbor.publisher": "Coastline Co.",
  "shop.title.vc-harbor.system": "8-bit Classics",
  "shop.title.vc-harbor.genre": "Racing",
  "shop.title.vc-harbor.rating": "Everyone",
  "shop.title.vc-harbor.blurb": "Zip past docks and lighthouses in a breezy top-down racer.",
  "shop.title.vc-castle.name": "Castle Capers 64",
  "shop.title.vc-castle.publisher": "North Peak",
  "shop.title.vc-castle.system": "3D Classics",
  "shop.title.vc-castle.genre": "Adventure",
  "shop.title.vc-castle.rating": "Everyone",
  "shop.title.vc-castle.blurb": "Explore a sprawling courtyard castle with camera-tilt charm.",
  "shop.title.vc-arcade.name": "Vector Blitz",
  "shop.title.vc-arcade.publisher": "Neon Arcade",
  "shop.title.vc-arcade.system": "Arcade Classics",
  "shop.title.vc-arcade.genre": "Arcade",
  "shop.title.vc-arcade.rating": "Everyone 10+",
  "shop.title.vc-arcade.blurb": "Crisp vector lines, high-score tables, and two-player co-op.",
  "shop.title.vc-tune.name": "Melody Master",
  "shop.title.vc-tune.publisher": "Soft Piano",
  "shop.title.vc-tune.system": "16-bit Classics",
  "shop.title.vc-tune.genre": "Music",
  "shop.title.vc-tune.rating": "Everyone",
  "shop.title.vc-tune.blurb": "Compose short jingles and clear rhythm stages with a light pen feel.",
  "shop.title.ww-balloon.name": "Balloon Picnic",
  "shop.title.ww-balloon.publisher": "Cloud Kitten",
  "shop.title.ww-balloon.system": "WiiWare",
  "shop.title.ww-balloon.genre": "Party",
  "shop.title.ww-balloon.rating": "Everyone",
  "shop.title.ww-balloon.blurb": "Keep balloons aloft with motion-friendly flicks and couch chaos.",
  "shop.title.ww-garden.name": "Pocket Garden",
  "shop.title.ww-garden.publisher": "Fern Lab",
  "shop.title.ww-garden.system": "WiiWare",
  "shop.title.ww-garden.genre": "Simulation",
  "shop.title.ww-garden.rating": "Everyone",
  "shop.title.ww-garden.blurb": "Grow a quiet rooftop garden and trade seeds with Miis in the plaza.",
  "shop.title.ww-sketch.name": "Sketch Duel",
  "shop.title.ww-sketch.publisher": "Ink & Play",
  "shop.title.ww-sketch.system": "WiiWare",
  "shop.title.ww-sketch.genre": "Puzzle",
  "shop.title.ww-sketch.rating": "Everyone",
  "shop.title.ww-sketch.blurb": "Draw shapes that become platforms — race a friend to the exit.",
  "shop.title.ww-drift.name": "Drift Kart Mini",
  "shop.title.ww-drift.publisher": "Corner Apex",
  "shop.title.ww-drift.system": "WiiWare",
  "shop.title.ww-drift.genre": "Racing",
  "shop.title.ww-drift.rating": "Everyone",
  "shop.title.ww-drift.blurb": "Tiny tracks, big slides, and item boxes that stay friendly.",
  "shop.title.ww-echo.name": "Echo Chamber",
  "shop.title.ww-echo.publisher": "Soft Wave",
  "shop.title.ww-echo.system": "WiiWare",
  "shop.title.ww-echo.genre": "Music",
  "shop.title.ww-echo.rating": "Everyone",
  "shop.title.ww-echo.blurb": "Point the remote like a baton and conduct a living-room orchestra.",
  "shop.title.ch-photoplus.name": "Photo Plus",
  "shop.title.ch-photoplus.publisher": "Menu Studio",
  "shop.title.ch-photoplus.system": "Channel",
  "shop.title.ch-photoplus.genre": "Utility",
  "shop.title.ch-photoplus.rating": "Everyone",
  "shop.title.ch-photoplus.blurb": "Extra album tools and slideshow themes for your Photo Channel.",
  "shop.title.ch-newsdesk.name": "News Desk",
  "shop.title.ch-newsdesk.publisher": "Menu Studio",
  "shop.title.ch-newsdesk.system": "Channel",
  "shop.title.ch-newsdesk.genre": "Info",
  "shop.title.ch-newsdesk.rating": "Everyone",
  "shop.title.ch-newsdesk.blurb": "A wider headline board with region filters and a soft ticker.",
  "shop.title.ch-forecastpro.name": "Sky Globe",
  "shop.title.ch-forecastpro.publisher": "Menu Studio",
  "shop.title.ch-forecastpro.system": "Channel",
  "shop.title.ch-forecastpro.genre": "Info",
  "shop.title.ch-forecastpro.rating": "Everyone",
  "shop.title.ch-forecastpro.blurb": "Spin a friendly globe and peek at sample weather worldwide.",
};

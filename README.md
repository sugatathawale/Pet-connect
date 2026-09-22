# 🐾 Pet Connect

A pet companion-matching app built with Expo (SDK 57) and expo-router.

Owners create profiles for their pets, browse pets nearby, match on mutual
interest, chat once matched, and post pets for adoption or sale.

## Running it

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for Android, or `w` for web — or scan
the QR code with **Expo Go** on a physical device.

## Folder structure

Routing lives in `app/` (file-based, via expo-router); everything else lives in
`src/` behind the `@/*` path alias.

```
app/                        Routes only — thin re-exports, no screen logic
  _layout.tsx               Root stack + providers (gesture handler, safe area, state)
  (tabs)/
    _layout.tsx             Bottom tab bar
    index.tsx               → NearbyScreen
    discover.tsx            → DiscoverScreen
    listings.tsx            → ListingsScreen
    chats.tsx               → ChatsScreen
    profile.tsx             → ProfileScreen
  pet/
    [id].tsx                → PetDetailScreen
    new.tsx                 → NewPetScreen
    availability.tsx        → AvailabilityScreen
  chat/[id].tsx             → ChatScreen
  listing/
    [id].tsx                → ListingDetailScreen
    new.tsx                 → NewListingScreen
  owner/[id].tsx            → OwnerScreen
  notifications.tsx         → NotificationsScreen
  assistant.tsx             → AIAssistantScreen (Agno FAQ / breed KB)
  settings.tsx              → SettingsScreen
  support.tsx               → SupportScreen

src/
  screens/                  Every screen lives here
    NearbyScreen.tsx        Nearby pets (home) — menu opens AI / settings / support
    DiscoverScreen.tsx      Swipe-to-match deck
    ListingsScreen.tsx      Adopt & sell marketplace
    ChatsScreen.tsx         Conversation list
    ProfileScreen.tsx       Owner profile + availability toggles
    PetDetailScreen.tsx     Pet detail, score breakdown, interest actions
    NewPetScreen.tsx        Create a pet profile
    AvailabilityScreen.tsx  Breeding availability + visibility controls
    ChatScreen.tsx          One-to-one chat
    ListingDetailScreen.tsx Listing detail
    NewListingScreen.tsx    Create a listing
    OwnerScreen.tsx         Public owner profile
    NotificationsScreen.tsx Notification feed
    AIAssistantScreen.tsx   In-app assistant (local KB + optional Agno API)
    SettingsScreen.tsx      Notification preferences
    SupportScreen.tsx       Help & safety
  components/
    ui/                     Generic primitives (Button, Badge, Chip, Field, Avatar…)
    pet/                    PetCard, SwipeDeck, FilterSheet, AvailabilityCard…
    chat/                   MessageBubble
    listing/                ListingCard
    menu/                   SideMenu (header drawer)
  constants/
    theme.ts                Design tokens — colours, overlays, space, radius
    config.ts               Score weights, filter defaults, storage keys
  context/AppContext.tsx    App-wide state, wiring the services together
  hooks/                    useNearbyPets (filter + distance + score), useImagePicker
  services/                 Data layer — the swap point for a real backend
    storage.ts              Typed AsyncStorage wrapper
    petService.ts           Pets & owners
    matchService.ts         Interests, mutual-match detection
    chatService.ts          Messages, block list
    listingService.ts       Adopt/sell listings
    notificationService.ts  In-app feed + local device notifications
    locationService.ts      Device location with graceful fallback
    demoService.ts          Demo-only: places seed data around the user
    aiAssistantService.ts   Agno chat API + local KB fallback
  types/index.ts            Domain model — the contract for everything above
  utils/                    geo, date, compatibility, privacy, intentMatcher
  data/
    seed.ts                 Demo pets/owners/listings
    knowledge/entries.ts    Local FAQ / breed knowledge (offline fallback)

backend/ai_assistant/       Optional Agno + FastAPI knowledge service
```

**Why `app/` still exists:** expo-router derives routes from the file tree, so
`app/pet/[id].tsx` *is* the URL `/pet/:id`. Those files are one-line re-exports
(`export { default } from '@/screens/PetDetailScreen'`) — routing stays declarative
in `app/`, and all screen code lives in `src/screens/`. The two `_layout.tsx` files
stay put because they configure navigators rather than render screens.

## How the features map to code

| Feature | Where |
|---|---|
| Create pet profile | [NewPetScreen](src/screens/NewPetScreen.tsx) |
| Nearby pets + filters | [NearbyScreen](src/screens/NearbyScreen.tsx), [useNearbyPets](src/hooks/useNearbyPets.ts) |
| Matching (interested / skip) | [SwipeDeck](src/components/pet/SwipeDeck.tsx), [matchService](src/services/matchService.ts) |
| Availability / heat status | [AvailabilityScreen](src/screens/AvailabilityScreen.tsx), [privacy.ts](src/utils/privacy.ts) |
| Chat | [ChatScreen](src/screens/ChatScreen.tsx) |
| Listings (adopt / sell) | [ListingsScreen](src/screens/ListingsScreen.tsx) |
| Owner profile | [ProfileScreen](src/screens/ProfileScreen.tsx), [OwnerScreen](src/screens/OwnerScreen.tsx) |
| Notifications | [notificationService](src/services/notificationService.ts) |
| Pet Connect Score | [compatibility.ts](src/utils/compatibility.ts) |
| AI Assistant / FAQ | [AIAssistantScreen](src/screens/AIAssistantScreen.tsx), [backend/ai_assistant](backend/ai_assistant) |

## AI Assistant (Agno)

Hamburger menu on Nearby (left of the location) opens **AI Assistant**, Settings, Support, and more.

- **Local KB** always answers greetings, app FAQs, and dog/cat breed questions (intent scraping + guardrails).
- **Optional Agno backend** for RAG over the same markdown knowledge bases:

```bash
cd backend/ai_assistant
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set GOOGLE_API_KEY (Gemini)
uvicorn main:app --reload --port 8787
```

Set `EXPO_PUBLIC_AI_API_URL` if the API is not on `localhost:8787`.

## Home dashboard

The home screen opens on a dashboard rather than a bare list:

- **Stat row** — Nearby / Matches / Available / Best score, each counting up on
  mount ([StatCard](src/components/ui/StatCard.tsx),
  [AnimatedCounter](src/components/ui/AnimatedCounter.tsx))
- **Top match card** — spotlight on the highest-scoring pet, with a slow sheen
  sweep and a pulsing score pill ([TopMatchCard](src/components/pet/TopMatchCard.tsx))
- **Available now rail** — horizontal carousel of pets open to matches, with live
  dots ([AvailableNowRail](src/components/pet/AvailableNowRail.tsx))
- **Staggered feed** — pet cards fade/spring in, each 60ms after the last

All animations use Reanimated 4 on the UI thread. The counters tween a shared
value and only pass the rounded integer back to JS, so a row of them stays cheap.

Note the rail surfaces only the public `availableForBreeding` flag — never the
private availability *dates*, which stay behind `canViewAvailability`.

**RN-web gotcha worth knowing:** `Animated.createAnimatedComponent(Pressable)`
silently drops function-form `style={({ pressed }) => …}` on web — cards rendered
at the wrong width with no background. The fix is an `Animated.View` wrapper
carrying `entering`, with a plain `Pressable` inside carrying the styles.

## Theme

Teal primary (`#0E9594`) with an amber accent. Teal is deliberately distinct from
the green used for health/success badges, so "Open to breeding" never competes
with "✅ Vaccinated" or the score pill — a problem the earlier coral palette had.

Every colour lives in [src/constants/theme.ts](src/constants/theme.ts); no
component hardcodes one, including translucent overlays. Changing the palette is
a single-file edit.

## Two design decisions worth knowing

**Privacy on reproductive data.** Availability windows default to `private`, and
every read goes through a single gate — `canViewAvailability` in
[src/utils/privacy.ts](src/utils/privacy.ts). Screens never read the
`availability` field directly, so the rule can't drift between surfaces. An
owner picks from *Only me* / *Owners I match with* / *Nearby owners*.

**The score is explainable.** `calculateCompatibility` returns each factor's
sub-score, weight, and a human reason, not just a number — so the pet detail
screen can show *why* a pair scored 92%. Weights live in
[src/constants/config.ts](src/constants/config.ts).

## Demo mode & location

Demo pets are **placed around wherever you actually are**, so distances read
believably from any city. Each seed record carries an `offsetKm` (east/north from
the user) and `demoService` converts those into real coordinates once the device
reports a location — verified from Mumbai, Bengaluru, and New York, all showing
the same 1.6–7.3 km spread.

Relocation is applied on every read rather than written back to storage, so the
original offsets survive and demo pets follow you if your location changes. Pets
*you* create have no `offsetKm` and are never moved — their location is real.

To remove demo mode: delete `src/services/demoService.ts`, drop the `offsetKm`
field from `src/types/index.ts`, and remove its calls in `src/context/AppContext.tsx`.

Location is never a gate — if permission is denied the app falls back to a default
city and still works. When reverse geocoding is unavailable (always on web), the
label falls back to the coordinate pair rather than a placeholder string.

## Data layer

V1 persists to `AsyncStorage` behind the `src/services/*` interface, seeded with
demo content on first launch. Screens and hooks never touch storage directly.

To move to a real backend (Supabase, Firebase, your own API), reimplement the
function bodies in `src/services/` — the types in `src/types/index.ts` are the
contract, so no screen needs to change. Two things are demo-only and should be
deleted at that point:

- `matchService.simulateReciprocalInterest` — stands in for the other owner
  tapping "interested", since demo owners have no device.
- The `notificationService.push` call after sending a chat message, which
  notifies *you* rather than the recipient.

## Notifications

Local notifications only, which work in Expo Go on both platforms. Remote push
needs a development build and credentials — out of scope for V1. The in-app feed
is the source of truth.

## Notes

- Dates are entered as `YYYY-MM-DD` text. A native date picker
  (`@react-native-community/datetimepicker`) is the obvious next upgrade.
- Ages are always derived from `dateOfBirth`, never stored, so they can't go stale.
- Location falls back to a default city centre when permission is denied — the
  feed still works, distances are just approximate.
- Shared locations in chat are deliberately blurred to ~1 km (`approximateLocation`).

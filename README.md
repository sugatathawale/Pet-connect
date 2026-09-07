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

src/
  screens/                  Every screen lives here
    NearbyScreen.tsx        Nearby pets (home)
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
  components/
    ui/                     Generic primitives (Button, Badge, Chip, Field, Avatar…)
    pet/                    PetCard, SwipeDeck, FilterSheet, AvailabilityCard…
    chat/                   MessageBubble
    listing/                ListingCard
  constants/
    theme.ts                Design tokens — every colour/space/radius
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
  types/index.ts            Domain model — the contract for everything above
  utils/                    geo (haversine), date (age), compatibility, privacy
  data/seed.ts              Demo pets/owners/listings
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

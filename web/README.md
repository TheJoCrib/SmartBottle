# SmartBottle Live Mirror (Web)

A lightweight web app that mirrors your real SmartBottle's live state for customers/visitors via a QR code. **No app rebuild required** — uses the existing Convex backend that the iOS/Android app already writes to.

## Routes

- `/` — landing page
- `/admin` — presenter login → toggle live mirror on/off → shows QR + share code
- `/?code=XYZ123ABC` — public mirror view (what customers see after scanning)

## How it works (data flow)

1. **iOS/Android app** (existing IPA) logs drinks via `api.drinks.log` → writes to Convex `drinkLogs` table.
2. **Presenter** opens `/admin` on any browser, logs in with their existing SmartBottle credentials, and taps **Starta live-spegling**. This calls `api.mirror.enable` which generates a 10-character share code and sets `mirrorEnabled: true` on the user record.
3. **Web shows a QR code** pointing at `https://<host>/?code=<shareCode>`. Print or display.
4. **Customers scan the QR** → land on the mirror page. The web subscribes to `api.mirror.getState({ shareCode })` which is a **public** Convex query (no auth) gated only by the share code.
5. Convex live queries push every update automatically. Each time the iOS/Android app logs a drink, the customer screen re-renders within ~100ms — bottle level animates down, daily progress fills, recent-drinks list adds a row, and a `−Xml` flash appears.

## Privacy

- The public query only returns data for users who have explicitly turned on `mirrorEnabled`.
- The share code is unguessable (10 chars, ~50 bits of entropy).
- The presenter can call `api.mirror.disable` at any time (or use the **Stäng av spegling** button) to stop sharing immediately.

## What is NOT mirrored

- Continuous live BLE weight (the smooth water-slosh as you tip the bottle). That data only exists on the connected phone via Bluetooth and isn't written to Convex on every tick.
- The customer view updates **after each drink event** is logged — i.e., when the bottle's weight delta crosses the drink-detection threshold.

To add continuous slosh in the future, the iOS/Android app would need to write the BLE weight to a `liveWeights` Convex table (~5-line change in `services/bluetooth.ts`).

## Local dev

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

The Convex URL is read from `VITE_CONVEX_URL`. Defaults to the project's deployment if unset.

## Deploy to Vercel

From the project root:

```bash
cd web
npx vercel --prod
```

Or import the repo into Vercel and set:
- **Root directory:** `web`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `VITE_CONVEX_URL`

## Convex deploy

After pulling, push the new `convex/mirror.ts` and schema field to your Convex deployment:

```bash
npx convex dev
```

(Run once, leaves a long-lived watcher running — Ctrl+C to stop.)

## File map

```
web/
├── src/
│   ├── main.tsx           # ConvexProvider mount
│   ├── App.tsx            # /, /admin, /?code= routing
│   ├── LandingPage.tsx    # Default page
│   ├── AdminPage.tsx      # Login + mirror toggle + QR
│   ├── MirrorPage.tsx     # Customer-facing live mirror
│   ├── BottleSvg.tsx      # Web port of BottleSkia animation
│   ├── AnimatedNumber.tsx # Smooth number tween
│   ├── convexApi.ts       # Re-exports generated api as any
│   ├── theme.ts           # Color tokens (mirrors RN theme)
│   └── styles.css         # Globals + keyframes
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts

convex/
├── mirror.ts              # NEW: enable/disable/getState/getMyShareCode
└── schema.ts              # Added: users.mirrorShareCode + mirrorEnabled
```

# Freq

Mobile-first web app for exploring **attract**, **lure** (thrown / Bluetooth speaker), and **deter** sound cues for cats, dogs, bears, mosquitoes, and bees.

Tones are generated in the browser with the **Web Audio API** — synthesized biological approximations and labeled frequency demos. Confidence badges mark **research**, **mixed**, **experimental**, and **myth**. This is a prototype, not medical advice or wildlife-safety gear.

## Run locally

```bash
npm install
npm run dev
```

Dev server: **http://localhost:3847** (bound on all interfaces).

```bash
npm run build
npm run preview
```

## How to use

1. Open the home screen and tap an animal. Optionally **Sign in** (local username + password — no email/OAuth).
2. Boards split into **Attract** (near you), **Lure** (set a speaker away and pull interest toward it), and **Deter**. Bears have no attract/lure. Bees are education only.
3. Tap a cue to **Play** one **~7 second** pass. Tap **∞** to **loop for 5 minutes**. **Stop** (or the square on the rail) cancels.
4. Heart a cue to favorite it; use the **Favorites** filter. Boards auto-sort by most played (favorites pin to the top).
5. Volume slider defaults to **Normal**; drag toward **Ultra loud** for intentional high-gain / outdoor throw (may distort).
6. If audio is blocked, tap **Enable sound**, then try again.
7. On **Cats**, **Cat listen** stays available: coarse call-type tagging with ethogram glosses — not an English translator.

## Local profiles

- Guest mode works offline on-device.
- Sign up / sign in stores a **salted PBKDF2 password hash** in `localStorage` — never plaintext.
- Favorites, play counts, and volume persist per username (or guest) on this device.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · shadcn-style Button · Lucide · Web Audio API

## Path to native

UI is mobile-first and suitable for a later Capacitor wrap for Android/iOS.

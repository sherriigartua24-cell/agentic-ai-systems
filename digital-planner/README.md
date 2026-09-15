# Digital Planner

A paper-planner-style dashboard that pulls your schedule from Google
Calendar and your checklist from Google Tasks, with room to take
handwritten notes during meetings. Built for use on a tablet (Pixel
Tablet + Chrome/Android), installed as a PWA so it lives on your home
screen like a native app.

- **Dashboard** mirrors a disc-bound paper planner: a month page
  (Priorities checklist, Important / Looking ahead, a graph-paper Notes
  box) and a week page (Mon–Sun day boxes with your events already
  filled in).
- **Handwriting, two ways:**
  - A freehand **ink canvas** on every day and on the month/week Notes
    boxes — write directly with your stylus, it stays as your actual
    handwriting (not converted to text), autosaves locally as you go.
  - Plain **text fields** (the quick-note box in each day's panel) that
    work with your tablet's own handwriting-to-text keyboard (Gboard's
    handwriting layer on Android, Scribble on iPad) — write in them with
    your stylus and the OS converts it to typed text automatically. No
    special integration needed; this is just how standard text inputs
    behave under those keyboards.
- **Priorities are real Google Tasks** — checking one off here checks it
  off in Google Tasks too.
- Notes are stored **locally on the device** (IndexedDB), not synced to
  Google — only calendar/task data comes from your account.

## 1. Create a Google Cloud OAuth client

You'll need your own Google Cloud project — there's no shared backend,
so this app talks to Google's APIs directly from the browser using your
own credentials.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   and create a new project (or pick an existing one).
2. **APIs & Services → Library**: enable the **Google Calendar API** and
   the **Google Tasks API**.
3. **APIs & Services → OAuth consent screen**: set it up as **External**
   (unless you have a Workspace account), fill in the required fields,
   and add your own Google account as a **test user** (this keeps it
   unpublished/private — fine for personal use).
4. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: add `http://localhost:5173` for
     local dev, plus whatever URL you deploy the app to later (e.g. a
     Vercel/Netlify URL) — the app is a static site, so a JS origin is
     all it needs, no redirect URI.
5. Copy the generated **Client ID**.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your client ID:

```
VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed `localhost` URL, click **Connect Google**, and grant
access to Calendar (read-only) and Tasks (read/write, so checking off a
Priority can sync back).

## 4. Install it on your tablet

Since your OAuth client's origin is `http://localhost:5173`, sign-in
only works when you're browsing from that exact origin. To actually use
this on your Pixel Tablet:

1. Deploy the built app (`npm run build` produces a static `dist/`
   folder) to any static host (Vercel, Netlify, GitHub Pages, Cloudflare
   Pages, etc.) — no server/backend needed.
2. Add that deployed URL as another **Authorized JavaScript origin** on
   the OAuth client (step 1.4 above).
3. On the tablet, open the deployed URL in Chrome, sign in, then use
   Chrome's menu → **Install app** (or the install prompt that appears)
   to add it to the home screen as a standalone PWA.

## Notes on the handwriting behavior

- The **ink canvas** (day boxes, Notes sections) uses pointer events
  with pressure sensitivity and simple palm rejection: once a pen
  pointer is actively drawing, touch input is ignored until the pen
  lifts, so a resting palm won't smudge the page.
- The **quick-note text field** is a plain `<textarea>` — Android's
  Gboard handwriting keyboard (or iPad Scribble, if you ever run this on
  an iPad) converts your handwriting to text there automatically. This
  isn't something the app implements; it's a feature of the OS keyboard
  acting on any standard text input.
- All notes are stored in the browser's IndexedDB, keyed per day/week/
  month. They're local to the device — reinstalling the PWA or clearing
  site data will clear them too. There's no cloud backup for notes in
  this version.

## Project structure

```
src/
  lib/
    googleAuth.ts    Google Identity Services OAuth token client
    calendar.ts       Calendar events + Google Tasks fetch/update
    notesDb.ts         IndexedDB storage for ink + quick notes
    monthColors.ts     Pastel tab palette
  components/
    SignIn.tsx          Connect-Google screen
    PlannerHeader.tsx   Month tabs + view toggle
    MonthPage.tsx        Priorities / Important / Looking ahead / Notes
    WeekPage.tsx          7-day grid with events pulled from Calendar
    InkCanvas.tsx          Freehand stylus drawing surface
    NotePanel.tsx           Per-day modal: quick-note field + ink canvas
```

## Development

```bash
npm run dev       # start dev server
npm run build     # type-check + production build (also generates the PWA service worker)
npm run lint      # oxlint
npm run preview   # preview the production build locally
```

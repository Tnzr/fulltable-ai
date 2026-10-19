# Demo mode (no Archie backend)

Run the app with working sign-in, registration and role-based dashboards, without Archie credentials:

```bash
bunx vite --config vite.config.demo.ts          # dev server on :3000
bunx vite build --config vite.config.demo.ts    # static demo build
```

On `/login` a **Demo access** card lets you pick a user type and either continue instantly or create an
account (name, email, password, user type). After that, the normal Sign in form works with that email and
password. Each type lands on its own dashboard via the existing `ROLE_LANDING` table:

| User type | Lands on |
|---|---|
| Owner / General Manager | `/overview` |
| Partnership Coordinator | `/overview` |
| Internal Marketing / Sales | `/my-tasks` |

How it works, with no edits to sealed files:

- `vite.config.demo.ts` aliases `@archie/react-sdk` to `react-sdk.tsx`, which re-exports the real SDK but
  hands `ArchieProvider` a client whose `auth` module is `demo-auth.ts` (accounts and session in
  `localStorage`). The SDK's own `useAuth` and `AuthGuard` then see a normal session.
- The same config swaps each repository the composition root builds for the in-memory adapter in
  `src/infrastructure/memory`, seeded from its fixture, so dashboards show sample data. Edits reset on reload.

**Not secure.** Passwords are stored in plain text in the browser and nothing is checked server-side. Use the
normal `bun run dev` with `VITE_ARCHIE_*` set for real accounts.

## Event Sourcing, demand map and the walkthrough

- **Event Sourcing** in demo mode answers the lead-engine GraphQL operations from `demo-graphql.ts`.
  "Run engine" adds the next batch of real Miami-Dade organizations (IRS exempt-org registry) with a
  recurring event each; they persist in `localStorage` and appear on the Network Map. Restaurants
  come from the Florida DBPR licence file (40+ seats).
- **Demand map** at `/demand-map` (button on Overview, Event Sourcing and Network Map): directable
  group guests per area, coverage slider, revenue and fee estimates. Data: `data/demand.json`.
- Rebuild both datasets: `python3 demo/geo/build_seed.py` (inputs in `demo/geo/data`, produced by
  `demo/geo/analyze.py`; assumptions are listed at the top of `build_seed.py`).
- Walkthrough (needs `pip install playwright && python3 -m playwright install chromium`):
  `python3 demo/walkthrough/walkthrough.py` writes screenshots, `walkthrough.webm`, `timings.json`
  and `summary.md` to `demo/walkthrough/out/`. Then `python3 demo/pitch/build_deck.py` builds the
  pitch deck PDF from that run into `demo/pitch/out/`.

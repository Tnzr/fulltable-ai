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

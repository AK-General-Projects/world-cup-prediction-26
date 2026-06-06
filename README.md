# World Cup 2026 Predictions

A private prediction league app for the 2026 FIFA World Cup. Built with Next.js, PostgreSQL (Drizzle ORM), NextAuth, and Tailwind CSS. Co-authored with [Claude](https://claude.ai).

## How it works

**Group stage** — users drag teams into their predicted finishing order for each of the 12 groups. Each group is saved independently on drag. 1 point is awarded per team correctly placed.

**Knockout stage** — once the admin enables it after the group stage, users click through the bracket to pick winners round by round. 1 point per correct pick, 2 for the final.

**Leaderboard** — ranks all users by total points. Clicking a user shows only their saved predictions. Scores update as actual results are entered by the admin.

**Admin panel** — controls prediction locks (group stage and knockout independently), bracket setup, and entering actual results.

## Running locally

```bash
npm install
npm run db:push   # apply schema to your Postgres database
npm run db:seed   # seed teams
npm run dev
```

Requires a `.env.local` with `DATABASE_URL`, `AUTH_SECRET`, and optionally `AUTH_URL`.

# Almond Jug

A chat interface that estimates the water footprint of each conversation and
shows it as a filling one-gallon jug, with a California almond equivalent at
the end of the session.

## What it does

Token counts come from the model provider's own usage data for each reply.
Those tokens are converted to an estimated water volume, displayed live in a
3D jug, and translated into almond equivalents on the session summary.

**These are modeled estimates, not measurements.** Published per-query water
figures differ by orders of magnitude depending on scope. See the methodology
section on the session summary page for sources and limitations.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Vercel AI SDK with the Mistral provider
- React Three Fiber for the jug
- Upstash Redis for rate limiting
- Vitest for the conversion tests

## Running locally

Create `.env.local`:

MISTRAL_API_KEY=your-key
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token

Rate limiting is skipped if the Upstash variables are absent.

npm install
npm run dev
npm test

## Key files

- `lib/water.ts` — all water and almond constants, with sources. Change
  estimates here and nowhere else.
- `lib/water.test.ts` — conversion tests.
- `app/api/chat/route.ts` — model call, rate limiting, request validation.
- `components/Jug3D.tsx` — the jug. Edit the `PROFILE` array to reshape it;
  the water level follows automatically.
- `components/SessionSummary.tsx` — end-of-session figures and methodology.

## Maintenance

The model is pinned to an explicit version rather than a `-latest` alias, so
the published figures always describe a known model. Pinned versions are
eventually retired, so this will need updating. Check Mistral's model list
and update `MODEL_ID` in `lib/water.ts`.

## Privacy

No conversations are stored. Session state lives in browser memory and is
lost on refresh.
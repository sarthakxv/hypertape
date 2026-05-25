# Hypertape Agent Notes

Use this file as the durable project context for future agent sessions. Keep it concise and update it when a major architectural, workflow, dependency, or product-direction change lands.

## Project

Hypertape is a Next.js app for a live probability tape on Hyperliquid outcome markets.

## Repo Shape

- `app/`: Next.js app routes, layouts, pages, and API routes.
- `components/`: React UI components, grouped by product area.
- `components/ui/`: shared UI primitives.
- `lib/`: domain logic and integrations, grouped by feature area.
- `docs/`: project documentation.

## Stack

- Next.js 15, React 19, TypeScript.
- Tailwind CSS 4 with PostCSS.
- SWR for client data fetching.
- lightweight-charts for charting.
- lucide-react for icons.
- Vitest, Testing Library, ESLint, and TypeScript for verification.

## Commands

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Lint: `npm run lint`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Production build: `npm run build`

## Agent Workflow

- Do not assume full-codebase context. Start with this file, `README.md`, `package.json`, and targeted `rg` searches.
- Prefer local patterns in `app/`, `components/`, and `lib/` before adding new abstractions.
- Keep edits scoped to the request and avoid unrelated refactors.
- Preserve user changes in the working tree. Do not revert changes unless explicitly asked.
- Use `rg`/`rg --files` for discovery before slower commands.
- Use `apply_patch` for manual edits.

## Verification Expectations

- For behavior or shared logic changes, run the narrowest relevant test first, then broaden to `npm test`, `npm run typecheck`, or `npm run build` based on risk.
- For UI changes, run the app and verify the affected screen in a browser when practical.
- If verification cannot be run, state why in the final response.

## Maintenance Rule

Update this `AGENTS.md` whenever a major change affects how future agents should understand or work in the repo, including:

- New top-level directories or ownership boundaries.
- Changed development, test, build, lint, or deployment commands.
- Major dependency, framework, or data-flow changes.
- Important product behavior that is not obvious from file names.
- New conventions that should guide future edits.

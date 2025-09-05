# Repository Guidelines

## Project Structure & Modules

- Monorepo managed via workspaces; primary code lives under `packages/`.
- Portals (Next.js apps): `packages/<portal>` (e.g., `katana`, `curve`, `pendle`). Each has `pages/`, `public/`, `next.config.js`, `tailwind.config.*`, and `constants.ts`.
- Shared library: `packages/lib` (components, hooks, utils, contexts, sections, types). Path aliases: `@lib/*`, `@utils/*`, `@common/*`, `@icons/*`, `@types`.
- Root config: `.eslintrc.js`, `.prettierrc`, `tsconfig.json`, `stylelint.config.js`, `commitlint.config.js`.

## Build, Test, and Development

- Install deps: `bun install`
- Run a portal in dev: `bun run dev:katana` (replace `katana` with target portal)
- Build a portal: `bun run build:katana`
- Serve a built portal: `bun run serve:katana`
- Lint (all packages): `bun run lint`
- Format: `bun run prettier-format`
- Tests: Vitest + Testing Library are available; run with `bun x vitest`. Name files `*.test.ts(x)` and colocate near sources or under `__tests__/`.

## Coding Style & Naming

- Prettier: tabs (width 4), single quotes, semicolons, width 120, no bracket spacing.
- TypeScript strict mode; prefer type-only imports.
- Naming (ESLint):
  - Functions/Components: `camelCase` or `PascalCase`.
  - Booleans: `PascalCase` starting with `is/has/should/can/will/...` (e.g., `isEnabled`).
  - Interfaces prefix `I` (e.g., `IUser`); type aliases prefix `T` (e.g., `TUser`).
  - Allow leading underscore for intentionally unused.
- Imports sorted via `simple-import-sort`; Tailwind plugin enabled.

## Testing Guidelines

- Frameworks: Vitest + @testing-library/react for React/Next components.
- Conventions: test filenames `*.test.tsx`; prefer user-facing queries; avoid implementation details.
- Run: `bun x vitest` (optionally `--ui` with Vitest UI if configured).

## Commit & Pull Requests

- Commits: Conventional Commits enforced via Commitlint (e.g., `feat: add vault widget`, `fix: correct APR rounding`).
- Branches: use short, descriptive names (e.g., `feat--steer-points`, `fix--apr-rounding`).
- PRs: include clear description, scope, linked issues, and screenshots for UI changes. Ensure `bun run lint` and `bun run build:<portal>` pass.

## Security & Configuration

- Environment: use `.env` (root and package-level as needed). Do not commit secrets.
- Next.js + Tailwind: ensure PostCSS/Tailwind configs stay synced across packages.
- Use provided TS path aliases instead of relative deep paths.

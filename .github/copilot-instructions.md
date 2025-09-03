# Copilot instructions for yearnX

Goal: Enable AI agents to work productively in this monorepo by following the established structure and conventions.

## Big picture

- Monorepo with multiple Next.js apps in `packages/*` and a shared library in `packages/lib`.
- Apps are thin shells; most config/UI/state/Web3 live in `packages/lib`.
- App `next.config.js` re-exports `require('../lib/next.config')`.
- Providers/state are composed via `@lib/contexts/WithContexts` (see `packages/katana/pages/_app.tsx`).

## Conventions

- Use TS path aliases from root `tsconfig.json`: `@lib/*`, `@common/*`, `@icons/*`, `@utils/*`.
- Pages Router is used; pages in `packages/*/pages/**`. Shared UI in `packages/lib/components/**` and `packages/lib/sections/**`.
- Styling: Tailwind + base `@lib/style.css` imported in each app’s `_app.tsx`.
- Chains/RPC: define in `@lib/utils/tools.chains.ts`; env-provided RPCs declared in `packages/lib/next.config.js`. Do not hardcode RPCs.
- Web3: use `@lib/contexts/useWeb3`, `@lib/contexts/useWallet`, and `retrieveConfig()` from `@lib/utils/wagmi/config`. Maintain SSR checks.
- Analytics/PWA/images: centralized in `packages/lib/next.config.js` (Plausible proxy, PWA, image domains). Update there when needed.
- Query-driven modals: use `nuqs` with `useQueryState` (example: `KatanaVaultItem.tsx` uses `vault`/`action`).
- Data: vaults via `@lib/hooks/useYearnVaults`; Katana APRs via `packages/katana/hooks/useKatanaAprs.ts` (localStorage cache, env `KATANA_APR_SERVICE_API`).
- Numbers/BN: prefer `@lib/utils` helpers (`format*`, `toAddress`, `handleInputChangeValue/EventValue`, etc.).

## Workflows

- Install at repo root (Bun lock present; any workspace-aware manager works).
- Per-package scripts (run in the package dir): `dev` (Next), `build` (`tsc && next build`), `start`, `export`.
- Root lint/format: `lint`, `prettier-format`.

## Key files

- App shell: `packages/katana/pages/_app.tsx`, `packages/katana/pages/index.tsx`.
- Providers: `packages/lib/contexts/WithContexts.tsx`, `WithMom.tsx`, `useWeb3.tsx`, `useWallet.tsx`.
- Wagmi/chains: `packages/lib/utils/wagmi/config.ts`, `packages/lib/utils/tools.chains.ts`.
- Next config hub: `packages/lib/next.config.js`.

## Integrations

- WalletConnect (`WALLETCONNECT_PROJECT_ID`), Plausible (proxied under `/js/*`), YDaemon (`YDAEMON_BASE_URI`), Katana APR service (`KATANA_APR_SERVICE_API`).
- RPCs fed via env maps in `packages/lib/next.config.js`; WS endpoints derived in Wagmi.

## Guardrails

- Reuse `@lib` providers/config; don’t duplicate Wagmi/RainbowKit setup in apps.
- Use aliases instead of deep relative imports; prefer public exports.
- Add/modify chains only via `tools.chains.ts` and env maps.
- Keep SSR safety (guard `window`, use `retrieveConfig`, honor `isIframe` logic).

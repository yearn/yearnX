# yearnX

## Getting Started

This monorepo uses [Bun](https://bun.sh/) workspaces to manage multiple Next.js portals and a shared component library.

### Prerequisites

- Install Bun v1.1 or newer.
- Clone the repository and switch into the project directory.
- Ensure you can run `bun` and `node` from your shell (Node is pulled in via Bun, but having a recent LTS locally helps).

### Install dependencies

Run the install from the repo root to hydrate every workspace:

```bash
bun install
```

### Environment variables

Shared defaults live in the root `.env`. Next.js portals automatically load this file (along with `.env.local` and `.env.<NODE_ENV>`) through the shared config in `packages/lib/next.config.js`.

Steps to configure envs:

- Copy `.env.example` to `.env` and fill in required values (never commit secrets).
- Optional overrides:
  - `.env.local` (root): local-only values that shadow `.env`.
  - `packages/<portal>/.env`: use only for portal-specific overrides you need during development (e.g. `packages/katana/.env` for an alternate API endpoint).

### Local development

- Start a portal: `bun run dev:<portal>` (e.g. `bun run dev:katana`).
- The script proxies into `packages/<portal>` and launches the associated Next.js dev server.

### Linting and formatting

- Lint everything: `bun run lint`
- Format sources: `bun run prettier-format`

### Testing

- The repo uses Vitest + Testing Library. Run all tests with:

```bash
bun x vitest
```

### Builds

- Build a portal for production: `bun run build:<portal>`
- Serve a built portal: `bun run serve:<portal>`

### Adding a new portal (high level)

- Scaffold the portal under `packages/<portal>` following existing examples.
- Configure `package.json` scripts for the new portal (`dev:<portal>`, `build:<portal>`, etc.) in the repo root.
- Ensure portal-specific env overrides are minimal and reference shared values by default.

poc for bb

# Mizan | ميزان

An English/Arabic Emirati wedding-planning competition demo with budgets, a wedding blueprint, fictional vendors and support programs, and simulated family collaboration.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mizan run dev` — frontend (use the managed workflow for PORT and BASE_PATH)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mizan/src/` — frontend, local demo persistence and bilingual UI.
- `artifacts/api-server/src/lib/mizan.ts` — deterministic illustrative financial analysis.
- `lib/api-spec/openapi.yaml` — assistant API contract; regenerate clients after edits.
- `attached_assets/Pasted--REPLIT-MASTER-BUILD-PROMPT-MIZAN-1-Product-overview-Bu_1793723446020.txt` — complete original product brief.

## Architecture decisions

- Browser-local persistence is intentional for a reliable competition demonstration, as permitted in the brief. Family collaboration is simulated, not multi-user access.
- The assistant deliberately uses a labelled deterministic rules engine so the demo never depends on a paid API or credentials.

## Product

Wedding organisation, editable expense and savings planning, vendor discovery/comparison, illustrative support matching, family coordination, and English/Arabic RTL support.

## User preferences

- All financial figures, vendors, ratings, support benefits, eligibility and deadlines must be clearly fictional SAMPLE/ILLUSTRATIVE data. Never imply real UAE government support, real vendor booking, or real payment capability.
- Mahr is distinct from vendor expenses. Do not assign financial responsibilities based on bride/groom gender.

## Gotchas

- Preserve the OpenAPI title `Api`; run codegen after contract changes.
- Use existing managed artifact workflows, not root `pnpm dev` or replacement services.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

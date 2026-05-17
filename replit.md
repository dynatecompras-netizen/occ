# MATERION - Sistema de Compras ERP

Sistema ERP industrial de compras com gerenciamento completo de OCCs (Ordens de Compra e Contratação), templates reutilizáveis, histórico de preços, e módulos de cadastro. Toda a interface está em Português Brasileiro (pt-BR).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/materion run dev` — run the frontend (port 20947)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/materion/src/pages/` — React frontend pages
- `artifacts/materion/src/components/` — Shared React components

## Architecture decisions

- Contract-first design: OpenAPI spec gates codegen which gates the frontend — never define types by hand
- All user-facing content is in pt-BR; internal code identifiers are in English
- Routes are registered in `artifacts/api-server/src/routes/index.ts`
- Price history (`historicos_precos`) is auto-recorded when OCC items are saved with a price
- OCC templates track `uso_count` and `ultimo_uso` — incremented every time a new OCC is created from that template
- OCC duplication always resets status to "Rascunho" and generates a new OCC number

## Product

**MATERION** is an industrial procurement ERP built for Brazilian manufacturing companies. Key capabilities:

- **OCC Management** — Full lifecycle from Rascunho → Aberta → Aprovada → Enviada → Concluída/Cancelada
- **Templates de OCC** — Two modes: "Estrutura" (structure only) and "Completo" (with standard items). Templates can be favorited and track usage history
- **Nova OCC Flow** — 3-way modal: criar do zero, a partir de template, ou duplicar OCC existente
- **Histórico de Preços** — Per-material price tracking across all OCCs, with supplier attribution
- **Cadastros** — Fornecedores, Empresas (CNPJ), Setores, Categorias, Materiais
- **Dashboard** — System-wide KPIs, OCC status breakdown, recent orders

## User preferences

- All UI text must remain in Brazilian Portuguese (pt-BR)
- No emojis in the UI

## Gotchas

- Always run codegen after any changes to `lib/api-spec/openapi.yaml`
- The `occsTable.numero` field is unique — generated as `OCC-YYYYMM-XXXX`
- Template items use `quantidade_padrao` as TEXT (numeric string) due to Drizzle limitations — parsed to float in route handlers
- The `/occs/from-template/:templateId` route must be registered BEFORE `/occs/:id` to avoid Express matching the slug

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

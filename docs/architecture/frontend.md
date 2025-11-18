# Frontend Architecture Guide

## Layered Structure (Feature‑Sliced Design)

```
src/
├─ app          # entry points, providers, router
├─ pages        # screen-level compositions, route wiring
├─ widgets      # reusable page sections composed from features/entities
├─ features     # user stories (cart:add, order:create) combining entities + shared
├─ entities     # domain models (product, user, cart) with data + UI
├─ shared       # platform-agnostic utilities, UI kit, api, config, state
```

**Rules**

- A layer can import itself or anything below it (e.g. `pages → widgets/features/entities/shared`). Upward imports are forbidden.
- `shared` is the only layer allowed to depend on third-party SDKs directly (Telegram, axios). Higher layers consume wrappers from `shared`.
- Cross-feature communication goes through entities or shared services—never by reaching into another feature’s internals.

## Import Policy

- Paths **must** use the `@/layer/...` alias, never relative `../../../` hops.
- Disallowed paths are validated via `eslint-plugin-import` + `import/no-restricted-paths`. Violations block CI.
- Only `shared` exposes primitives (UI Kit, hooks, utils). Anything re-exported higher must follow the dependency rule above.

## Data & State Management

| Concern            | Tool            | Notes |
| ------------------ | --------------- | ----- |
| Remote/server data | TanStack Query  | All network reads go through typed hooks in `shared/api/queries`. Cache keys defined in `entities/*/api`. |
| Local business data| Zustand         | Long-lived client state (cart draft, selections, theme, modals) sits in stores at `shared/state`. |
| Ephemeral UI state | React useState  | Component-local only. If more than one feature needs it, promote to Zustand or Query cache. |

Patterns:
- Use `useQuery` wrappers (e.g. `useProductsQuery`) from `shared/api/queries` inside pages/widgets/features.
- Mutations should invalidate matching query keys in the hook to keep cache consistent.
- Never mix manual `useState` copies of server data with TanStack Query results.

## UI System & Tokens

- Tailwind design tokens defined in `tailwind.config.ts` (colors, spacing, typography). Only tokens, no raw hex colors in components.
- `shared/ui` houses canonical primitives: `Button`, `Input`, `Text`, `Modal`, `Skeleton`, etc.
- Widgets/features compose only via these primitives + entity components to ensure consistent look & feel.

## Testing & Tooling

- ESLint enforces architecture via path restrictions and import order.
- Prettier + Husky + lint-staged keep the codebase formatted and typed before every commit.
- When adding a new layer artifact, update this document if rules change.

## Migration Checklist

1. New module? Determine its layer, place it accordingly.
2. Expose data via entity APIs and shared hooks before touching UI.
3. For new UI, build primitives in `shared/ui` first; consume them in entities/features.
4. Keep state where it belongs (TanStack Query for server data, Zustand for persistent client state).
5. Add/adjust ESLint path rules if a new layer/path alias appears.

Following these conventions keeps the frontend predictable, scalable, and ready for Principal-level reviews. 


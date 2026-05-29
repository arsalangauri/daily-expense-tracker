---
name: Expo duplicate React from api-client-react
description: Adding @workspace/api-client-react to an Expo app's devDependencies causes a duplicate React instance → "Invalid hook call" error at runtime.
---

## Rule
Never add `@workspace/api-client-react` (or any workspace lib that depends on React) to an Expo artifact's `package.json`. The monorepo's pnpm hoisting doesn't deduplicate React across the workspace boundary correctly for Metro bundler, resulting in two React instances.

**Why:** Metro resolves modules differently from Node/webpack. When `@workspace/api-client-react` brings its own React reference, Metro bundles both, violating React's single-instance requirement. The symptom is "Invalid hook call. Hooks can only be called inside of the body of a function component."

**How to apply:** Expo apps should call the API directly via `fetch` or write local hooks. Do not import from `@workspace/api-client-react`. If the Expo app needs generated types, copy only the type definitions, not the full package.

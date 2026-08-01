# packages

Shared Bun workspace packages for ania.

- `@ania/domain-shared` — shared domain vocabulary (enums, permission slugs/namespaces, soft-delete actions). No HTTP types, no entities.
- `@ania/api-contract` — HTTP request/response TypeScript types and `ApiError` helpers. Uses `domain-shared` types in DTO fields; does not re-export that vocabulary.
- `@ania/date` — date helpers (ISO week/year).

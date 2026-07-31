# @ania/api-contract

Shared HTTP types and Zod input schemas between API, admin, and client.

Import per module (no barrel):

```ts
import type { AnimeDto, CreateAnimeInput } from "@ania/api-contract/anime";
import { CreateAnimeInputSchema } from "@ania/api-contract/anime";
```

- **Response DTOs** remain TypeScript interfaces.
- **Request inputs** are Zod schemas (`*InputSchema`) with types via `z.infer` — used by Fastify for runtime validation.

Dates on the wire are ISO `string`. Never duplicate these shapes in the apps.

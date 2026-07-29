# @ania/api-contract

Shared TypeScript types for HTTP request/response bodies between API, admin, and client.

Import per module (no barrel):

```ts
import type { AnimeDto, CreateAnimeInput } from "@ania/api-contract/anime";
```

Dates on the wire are ISO `string`. Never duplicate these interfaces in the apps.

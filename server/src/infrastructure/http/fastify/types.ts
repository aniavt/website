import type {
    FastifyBaseLogger,
    FastifyInstance,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
} from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export type ZodFastifyInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger,
    ZodTypeProvider
>;

export type RoutePrefixUrl = (path: string) => string;
export type RegisterRouteFn<Dependencies> = (
    app: ZodFastifyInstance,
    prefixUrl: RoutePrefixUrl,
    deps: Dependencies,
) => void;

import type { FastifyInstance } from "fastify";


export type RoutePrefixUrl = (path: string) => string;
export type RegisterRouteFn<Dependencies> = (app: FastifyInstance, prefixUrl: RoutePrefixUrl, deps: Dependencies) => void;

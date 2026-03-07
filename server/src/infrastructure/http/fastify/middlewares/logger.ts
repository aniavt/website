import type { FastifyReply, FastifyRequest } from "fastify";


declare module "fastify" {
    interface FastifyRequest {
        currentRequest?: {
            startTime: number;
            method: string;
            url: string;
            statusCode: number;
            responseTime: number;
            ip: string;
            userAgent: string;
            referer: string;
            host: string;
        };
    }
}

export async function startRequestLogging(request: FastifyRequest, reply: FastifyReply) {
    request.currentRequest = {
        startTime: Date.now(),
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: 0,
        ip: request.ip,
        userAgent: request.headers["user-agent"] ?? "",
        referer: request.headers["referer"] ?? "",
        host: request.headers["host"] ?? "",
    }
}

export async function endRequestLogging(request: FastifyRequest, reply: FastifyReply) {
    if (!request.currentRequest) return;
    request.currentRequest.responseTime = Date.now() - request.currentRequest.startTime;
    request.currentRequest.statusCode = reply.statusCode;

    // yyyy-mm-dd hh:mm:ss
    const date = new Date().toISOString().split("T")[0];
    console.group(`[${date} ${new Date().toTimeString().split(" ")[0]}] ${request.currentRequest!.method} ${request.currentRequest!.url}`);
    console.log(`Status: ${request.currentRequest.statusCode}`);
    console.log(`Response Time: ${request.currentRequest.responseTime}ms`);
    console.log(`IP: ${request.currentRequest.ip}`);
    console.log(`User Agent: ${request.currentRequest.userAgent}`);
    console.log(`Referer: ${request.currentRequest.referer}`);
    console.log(`Host: ${request.currentRequest.host}`);
    console.groupEnd();
}
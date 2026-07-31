import type { FastifyRequest } from "fastify";
import type { ZodType } from "zod";
import {
    UPLOAD_ALLOWED_MIME_TYPES,
    UPLOAD_FILENAME_MAX,
    UPLOAD_MAX_FILE_BYTES,
    type UploadAllowedMimeType,
} from "@ania/api-contract/media";

export type MultipartFilePayload = {
    name: string;
    contentType: string;
    size: number;
    body: Buffer;
};

export type ParseMultipartOk<TFields> = {
    ok: true;
    file: MultipartFilePayload;
    fields: TFields;
};

export type ParseMultipartErr = {
    ok: false;
    error: "media_invalid_input" | "weekly_schedule_invalid_week";
};

function isAllowedMime(mimetype: string): mimetype is UploadAllowedMimeType {
    return (UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(mimetype);
}

function fieldValues(fields: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, part] of Object.entries(fields)) {
        if (part && typeof part === "object" && "value" in part) {
            out[key] = (part as { value: unknown }).value;
        } else {
            out[key] = part;
        }
    }
    return out;
}

async function readValidatedFile(
    request: FastifyRequest,
): Promise<{ ok: true; file: MultipartFilePayload; rawFields: Record<string, unknown> } | ParseMultipartErr> {
    const file = await request.file();
    if (!file) {
        return { ok: false, error: "media_invalid_input" };
    }

    const name = file.filename?.trim() ?? "";
    if (!name || name.length > UPLOAD_FILENAME_MAX) {
        return { ok: false, error: "media_invalid_input" };
    }

    if (!isAllowedMime(file.mimetype)) {
        return { ok: false, error: "media_invalid_input" };
    }

    let buffer: Buffer;
    try {
        buffer = await file.toBuffer();
    } catch {
        return { ok: false, error: "media_invalid_input" };
    }

    if (buffer.length <= 0 || buffer.length > UPLOAD_MAX_FILE_BYTES) {
        return { ok: false, error: "media_invalid_input" };
    }

    return {
        ok: true,
        file: {
            name,
            contentType: file.mimetype,
            size: buffer.length,
            body: buffer,
        },
        rawFields: fieldValues(file.fields as Record<string, unknown>),
    };
}

/** Read one multipart file; enforce size/MIME/filename. */
export async function parseMultipartFile(
    request: FastifyRequest,
): Promise<ParseMultipartOk<undefined> | ParseMultipartErr>;
export async function parseMultipartFile<TFields>(
    request: FastifyRequest,
    options: { fieldsSchema: ZodType<TFields> },
): Promise<ParseMultipartOk<TFields> | ParseMultipartErr>;
export async function parseMultipartFile<TFields>(
    request: FastifyRequest,
    options?: { fieldsSchema: ZodType<TFields> },
): Promise<ParseMultipartOk<TFields | undefined> | ParseMultipartErr> {
    const validated = await readValidatedFile(request);
    if (!validated.ok) {
        return validated;
    }

    if (!options?.fieldsSchema) {
        return { ok: true, file: validated.file, fields: undefined };
    }

    const parsed = options.fieldsSchema.safeParse(validated.rawFields);
    if (!parsed.success) {
        return { ok: false, error: "weekly_schedule_invalid_week" };
    }

    return { ok: true, file: validated.file, fields: parsed.data };
}

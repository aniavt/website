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

async function readValidatedMultipart(
    request: FastifyRequest,
): Promise<{ ok: true; file: MultipartFilePayload; rawFields: Record<string, unknown> } | ParseMultipartErr> {
    // Iterate all parts so field order relative to the file does not matter,
    // and so the file part is never mixed into schema field values (.strict()).
    const rawFields: Record<string, unknown> = {};
    let filePayload: MultipartFilePayload | null = null;

    try {
        for await (const part of request.parts()) {
            if (part.type === "file") {
                if (filePayload) {
                    // Drain extra file streams; only the first file is accepted.
                    await part.toBuffer().catch(() => undefined);
                    continue;
                }

                const name = part.filename?.trim() ?? "";
                if (!name || name.length > UPLOAD_FILENAME_MAX) {
                    return { ok: false, error: "media_invalid_input" };
                }
                if (!isAllowedMime(part.mimetype)) {
                    return { ok: false, error: "media_invalid_input" };
                }

                let buffer: Buffer;
                try {
                    buffer = await part.toBuffer();
                } catch (error) {
                    console.error("media_invalid_input", error);
                    return { ok: false, error: "media_invalid_input" };
                }

                if (buffer.length <= 0 || buffer.length > UPLOAD_MAX_FILE_BYTES) {
                    return { ok: false, error: "media_invalid_input" };
                }

                filePayload = {
                    name,
                    contentType: part.mimetype,
                    size: buffer.length,
                    body: buffer,
                };
                continue;
            }

            rawFields[part.fieldname] = part.value;
        }
    } catch (error) {
        console.error("media_invalid_input", error);
        return { ok: false, error: "media_invalid_input" };
    }

    if (!filePayload) {
        return { ok: false, error: "media_invalid_input" };
    }

    return { ok: true, file: filePayload, rawFields };
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
    const validated = await readValidatedMultipart(request);
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

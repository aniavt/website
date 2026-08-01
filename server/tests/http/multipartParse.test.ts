import { describe, expect, test } from "bun:test";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { UploadWeeklyScheduleFieldsSchema } from "@ania/api-contract/weekly-schedule";
import { UPLOAD_MAX_FILE_BYTES } from "@ania/api-contract/media";
import { parseMultipartFile } from "@infrastructure/http/fastify/multipart";

const BOUNDARY = "----aniaTestBoundary";
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

type Part =
  | { kind: "field"; name: string; value: string }
  | { kind: "file"; name: string; filename: string; contentType: string; body: Buffer };

function buildMultipartBody(parts: Part[]): Buffer {
  const chunks: Buffer[] = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${BOUNDARY}\r\n`));
    if (part.kind === "file") {
      chunks.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n` +
            `Content-Type: ${part.contentType}\r\n\r\n`,
        ),
      );
      chunks.push(part.body);
      chunks.push(Buffer.from("\r\n"));
    } else {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}\r\n`));
    }
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

async function buildMultipartApp() {
  const app = Fastify({ bodyLimit: UPLOAD_MAX_FILE_BYTES });
  await app.register(multipart, { limits: { fileSize: UPLOAD_MAX_FILE_BYTES } });
  app.post("/parse", async (request, reply) => {
    const parsed = await parseMultipartFile(request, {
      fieldsSchema: UploadWeeklyScheduleFieldsSchema,
    });
    if (!parsed.ok) {
      return reply.status(400).send({ error: parsed.error });
    }
    return reply.send({
      week: parsed.fields.week,
      year: parsed.fields.year,
      fileName: parsed.file.name,
      size: parsed.file.size,
    });
  });
  await app.ready();
  return app;
}

const filePart: Part = {
  kind: "file",
  name: "file",
  filename: "schedule.png",
  contentType: "image/png",
  body: PNG_1X1,
};

describe("parseMultipartFile (weekly-schedule fields)", () => {
  test("fields before file: parses week/year", async () => {
    const app = await buildMultipartApp();
    const body = buildMultipartBody([
      { kind: "field", name: "week", value: "31" },
      { kind: "field", name: "year", value: "2026" },
      filePart,
    ]);

    const res = await app.inject({
      method: "POST",
      url: "/parse",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ week: 31, year: 2026, fileName: "schedule.png" });
    await app.close();
  });

  test("fields after file: parses week/year (order-independent)", async () => {
    const app = await buildMultipartApp();
    const body = buildMultipartBody([
      filePart,
      { kind: "field", name: "week", value: "31" },
      { kind: "field", name: "year", value: "2026" },
    ]);

    const res = await app.inject({
      method: "POST",
      url: "/parse",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ week: 31, year: 2026, fileName: "schedule.png" });
    await app.close();
  });

  test("invalid week field returns weekly_schedule_invalid_week", async () => {
    const app = await buildMultipartApp();
    const body = buildMultipartBody([
      { kind: "field", name: "week", value: "99" },
      { kind: "field", name: "year", value: "2026" },
      filePart,
    ]);

    const res = await app.inject({
      method: "POST",
      url: "/parse",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "weekly_schedule_invalid_week" });
    await app.close();
  });
});

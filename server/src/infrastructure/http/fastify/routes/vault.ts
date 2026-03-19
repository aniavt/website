import type { FastifyReply, FastifySchema } from "fastify";
import type { RegisterRouteFn } from "../types";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IVaultUseCases } from "@application/vault/IVaultUseCases";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import type { MediaError } from "@application/media/errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import type { VaultError } from "@application/vault/errors";

export interface VaultRoutesDependencies {
    userUseCases: IUserUseCases;
    vaultUseCases: IVaultUseCases;
    mediaUseCases: IMediaUseCases;
}

function mapMediaErrorToHttpCode(error: MediaError): number {
    switch (error) {
        case "media_invalid_input":
            return 400;
        case "media_upload_failed":
        case "media_delete_failed":
            return 500;
        default:
            return 500;
    }
}

function sendMediaError(reply: FastifyReply, error: MediaError) {
    return reply.status(mapMediaErrorToHttpCode(error)).send({ error });
}

function mapVaultErrorToHttpCode(error: VaultError): number {
    switch (error) {
        case "vault_node_not_found":
        case "vault_tag_not_found":
            return 404;
        case "vault_not_authorized":
            return 401;
        case "vault_invalid_input":
        case "vault_duplicate_name":
            return 400;
        default:
            return 500;
    }
}

function sendVaultError(reply: FastifyReply, error: VaultError) {
    return reply.status(mapVaultErrorToHttpCode(error)).send({ error });
}

const createOrRenameTagSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            name: { type: "string" },
        },
        additionalProperties: false,
    },
};

const createFolderSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            parentId: { type: "string", nullable: true },
            name: { type: "string" },
            isPublic: { type: "boolean" },
        },
        additionalProperties: false,
    },
};

const createFileNodeSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["name", "sourceType"],
        properties: {
            parentId: { type: "string", nullable: true },
            name: { type: "string" },
            sourceType: { type: "string", enum: ["external", "internal"] },
            server: { type: "string", nullable: true },
            urlOrFileId: { type: "string" },
            isPublic: { type: "boolean" },
        },
        additionalProperties: false,
    },
};

const addSourceToNodeSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["type"],
        properties: {
            type: { type: "string", enum: ["external", "internal"] },
            server: { type: "string", nullable: true },
            urlOrFileId: { type: "string" },
        },
        additionalProperties: false,
    },
};

const updateSourceSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            type: { type: "string", enum: ["external", "internal"] },
            server: { type: "string", nullable: true },
            urlOrFileId: { type: "string" },
        },
        additionalProperties: false,
    },
};

const setNodePublicSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["nodeId", "isPublic"],
        properties: {
            nodeId: { type: "string" },
            isPublic: { type: "boolean" },
        },
        additionalProperties: false,
    },
};

const setThumbnailSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["nodeId"],
        properties: {
            nodeId: { type: "string" },
            thumbnailFileId: { type: "string", nullable: true },
        },
        additionalProperties: false,
    },
};

const renameNodeSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["nodeId", "newName"],
        properties: {
            nodeId: { type: "string" },
            newName: { type: "string" },
        },
        additionalProperties: false,
    },
};

const nodeTagSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["nodeId", "tagId"],
        properties: {
            nodeId: { type: "string" },
            tagId: { type: "string" },
        },
        additionalProperties: false,
    },
};

export const registerVaultRoutes: RegisterRouteFn<VaultRoutesDependencies> = (
    app,
    prefixUrl,
    { userUseCases, vaultUseCases, mediaUseCases },
) => {
    app.post(prefixUrl("/vault/tags"), { preHandler: authenticate(userUseCases), schema: createOrRenameTagSchema }, async (request, reply) => {
        const body = request.body as { name: string };
        const result = await vaultUseCases.createTag.execute(request.user!.id, body.name);
        if (result.isError()) return sendVaultError(reply, result.error);
        return reply.status(201).send(result.data);
    });

    app.patch<{ Params: { id: string } }>(
        prefixUrl("/vault/tags/:id"),
        { preHandler: authenticate(userUseCases), schema: createOrRenameTagSchema },
        async (request, reply) => {
            const body = request.body as { name: string };
            const result = await vaultUseCases.renameTag.execute(request.user!.id, request.params.id, body.name);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete<{ Params: { id: string } }>(
        prefixUrl("/vault/tags/:id"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await vaultUseCases.deleteTag.execute(request.user!.id, request.params.id);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(204).send();
        },
    );

    app.get(prefixUrl("/vault/tags"), async (_request, reply) => {
        const result = await vaultUseCases.listTags.execute();
        if (result.isError()) return sendVaultError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Querystring: { parentId?: string } }>(
        prefixUrl("/vault/children"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const parentId = request.query.parentId ?? null;
            const requesterId = request.user?.id ?? null;

            const result = await vaultUseCases.getChildren.execute(requesterId, parentId);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get<{ Querystring: { parentId?: string; name: string } }>(
        prefixUrl("/vault/node-by-name"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const { parentId, name } = request.query;
            const requesterId = request.user?.id ?? null;

            if (!name) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            const result = await vaultUseCases.getNodeByParentAndName.execute(
                requesterId,
                parentId ?? null,
                name,
            );

            // getNodeByParentAndName nunca retorna error nulo; si isError es true, error es un VaultError
            if (result.isError()) {
                return sendVaultError(reply, result.error as VaultError);
            }

            return reply.send(result.data);
        },
    );

    app.get<{ Querystring: { tagId?: string; tagName?: string } }>(
        prefixUrl("/vault/nodes"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const { tagId, tagName } = request.query;
            const requesterId = request.user?.id ?? null;

            if (!tagId && !tagName) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            const result = tagId
                ? await vaultUseCases.findNodesByTag.execute(requesterId, tagId)
                : await vaultUseCases.findNodesByTagName.execute(requesterId, tagName!);

            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(
        prefixUrl("/vault/folders"),
        { preHandler: authenticate(userUseCases), schema: createFolderSchema },
        async (request, reply) => {
            const body = request.body as { parentId: string | null; name: string; isPublic?: boolean };
            const result = await vaultUseCases.createFolder.execute(request.user!.id, {
                parentId: body.parentId ?? null,
                name: body.name,
                isPublic: body.isPublic,
            });
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.post(
        prefixUrl("/vault/files"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            // Soportamos:
            // - JSON (externo o interno con fileId ya resuelto)
            // - multipart/form-data con archivo para source interna
            const isMultipart = (request as any).isMultipart?.() === true;

            let parentId: string | null = null;
            let name: string;
            let sourceType: "external" | "internal";
            let server: string | null = null;
            let urlOrFileId: string | null = null;
            let isPublic: boolean | undefined;

            if (isMultipart) {
                const file = await (request as any).file?.();
                if (!file) {
                    return reply.status(400).send({ error: "vault_invalid_input" });
                }

                const fields = (file.fields ?? {}) as Record<string, { value: string }>;
                const nameField = fields.name?.value as string | undefined;
                const parentField = fields.parentId?.value as string | undefined;
                const sourceTypeField = fields.sourceType?.value as
                    | "external"
                    | "internal"
                    | undefined;
                const serverField = fields.server?.value as string | undefined;
                const isPublicField = fields.isPublic?.value as string | undefined;

                if (!nameField || !sourceTypeField) {
                    return reply.status(400).send({ error: "vault_invalid_input" });
                }

                name = nameField;
                sourceType = sourceTypeField;
                parentId = parentField && parentField.length > 0 ? parentField : null;
                server = serverField ?? null;
                if (isPublicField !== undefined) {
                    isPublic = isPublicField === "true";
                }

                if (sourceType === "internal") {
                    const buffer = await file.toBuffer();
                    const uploadResult = await mediaUseCases.uploadFile.execute({
                        name: file.filename,
                        contentType: file.mimetype,
                        size: buffer.length,
                        body: buffer,
                        isPrivate: true,
                    });

                    if (uploadResult.isError()) {
                        return sendMediaError(reply, uploadResult.error);
                    }

                    urlOrFileId = uploadResult.data.id;
                } else {
                    const urlField = fields.urlOrFileId?.value as string | undefined;
                    if (!urlField) {
                        return reply.status(400).send({ error: "vault_invalid_input" });
                    }
                    urlOrFileId = urlField;
                }
            } else {
                const body = request.body as {
                    parentId?: string | null;
                    name: string;
                    sourceType: "external" | "internal";
                    server?: string | null;
                    urlOrFileId?: string;
                    isPublic?: boolean;
                };

                name = body.name;
                sourceType = body.sourceType;
                parentId = body.parentId ?? null;
                server = body.server ?? null;
                urlOrFileId = body.urlOrFileId ?? null;
                isPublic = body.isPublic;
            }

            if (sourceType === "external" && !urlOrFileId) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            if (sourceType === "internal" && !urlOrFileId) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            const result = await vaultUseCases.createFileNode.execute(request.user!.id, {
                parentId,
                name,
                sourceType,
                server,
                urlOrFileId: urlOrFileId!,
                isPublic,
            });
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.post(
        prefixUrl("/vault/node/public"),
        { preHandler: authenticate(userUseCases), schema: setNodePublicSchema },
        async (request, reply) => {
            const body = request.body as { nodeId: string; isPublic: boolean };
            const result = await vaultUseCases.setNodePublic.execute(
                request.user!.id,
                body.nodeId,
                body.isPublic,
            );
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(
        prefixUrl("/vault/node/thumbnail"),
        { preHandler: authenticate(userUseCases), schema: setThumbnailSchema },
        async (request, reply) => {
            const body = request.body as { nodeId: string; thumbnailFileId: string | null };
            const result = await vaultUseCases.setThumbnail.execute(
                request.user!.id,
                body.nodeId,
                body.thumbnailFileId ?? null,
            );
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(
        prefixUrl("/vault/node/tag/add"),
        { preHandler: authenticate(userUseCases), schema: nodeTagSchema },
        async (request, reply) => {
            const body = request.body as { nodeId: string; tagId: string };
            const result = await vaultUseCases.addTagToNode.execute(
                request.user!.id,
                body.nodeId,
                body.tagId,
            );
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(204).send();
        },
    );

    app.post(
        prefixUrl("/vault/node/tag/remove"),
        { preHandler: authenticate(userUseCases), schema: nodeTagSchema },
        async (request, reply) => {
            const body = request.body as { nodeId: string; tagId: string };
            const result = await vaultUseCases.removeTagFromNode.execute(
                request.user!.id,
                body.nodeId,
                body.tagId,
            );
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(204).send();
        },
    );

    app.post(
        prefixUrl("/vault/node/rename"),
        { preHandler: authenticate(userUseCases), schema: renameNodeSchema },
        async (request, reply) => {
            const body = request.body as { nodeId: string; newName: string };
            const result = await vaultUseCases.renameNode.execute(
                request.user!.id,
                body.nodeId,
                body.newName,
            );
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete<{ Params: { id: string } }>(
        prefixUrl("/vault/node/:id"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await vaultUseCases.deleteNode.execute(request.user!.id, request.params.id);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(204).send();
        },
    );

    app.get<{ Params: { id: string } }>(
        prefixUrl("/vault/node/:id/tags"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const requesterId = request.user?.id ?? null;
            const result = await vaultUseCases.getTagsForNode.execute(requesterId, request.params.id);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get<{ Params: { id: string } }>(
        prefixUrl("/vault/node/:id/sources"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const requesterId = request.user?.id ?? null;
            const result = await vaultUseCases.getSourcesForNode.execute(requesterId, request.params.id);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post<{ Params: { id: string } }>(
        prefixUrl("/vault/node/:id/sources"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            // Soportamos dos modos:
            // - JSON (fuentes externas o internas con fileId ya resuelto)
            // - multipart/form-data con un archivo para fuentes internas
            const isMultipart = (request as any).isMultipart?.() === true;

            let type: "external" | "internal";
            let server: string | null = null;
            let urlOrFileId: string | null = null;

            if (isMultipart) {
                const file = await (request as any).file?.();
                if (!file) {
                    return reply.status(400).send({ error: "vault_invalid_input" });
                }

                const fields = (file.fields ?? {}) as Record<string, { value: string }>;
                const typeField = fields.type?.value as "external" | "internal" | undefined;
                const serverField = fields.server?.value as string | undefined;

                if (!typeField) {
                    return reply.status(400).send({ error: "vault_invalid_input" });
                }

                type = typeField;
                server = serverField ?? null;

                if (type === "internal") {
                    const buffer = await file.toBuffer();
                    const uploadResult = await mediaUseCases.uploadFile.execute({
                        name: file.filename,
                        contentType: file.mimetype,
                        size: buffer.length,
                        body: buffer,
                        isPrivate: true,
                    });

                    if (uploadResult.isError()) {
                        return sendMediaError(reply, uploadResult.error);
                    }

                    urlOrFileId = uploadResult.data.id;
                } else {
                    // Para tipo externo con multipart exigir urlOrFileId en fields
                    const urlField = fields.urlOrFileId?.value as string | undefined;
                    if (!urlField) {
                        return reply.status(400).send({ error: "vault_invalid_input" });
                    }
                    urlOrFileId = urlField;
                }
            } else {
                const body = request.body as {
                    type: "external" | "internal";
                    server?: string | null;
                    urlOrFileId?: string;
                };

                type = body.type;
                server = body.server ?? null;
                urlOrFileId = body.urlOrFileId ?? null;
            }

            if (type === "external" && !urlOrFileId) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            if (type === "internal" && !urlOrFileId) {
                return reply.status(400).send({ error: "vault_invalid_input" });
            }

            const result = await vaultUseCases.addSourceToNode.execute(request.user!.id, {
                nodeId: request.params.id,
                type,
                server,
                urlOrFileId: urlOrFileId!,
            });
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.patch<{ Params: { sourceId: string } }>(
        prefixUrl("/vault/sources/:sourceId"),
        { preHandler: authenticate(userUseCases), schema: updateSourceSchema },
        async (request, reply) => {
            const body = request.body as {
                type?: "external" | "internal";
                server?: string | null;
                urlOrFileId?: string;
            };
            const result = await vaultUseCases.updateSource.execute(request.user!.id, {
                sourceId: request.params.sourceId,
                type: body.type,
                server: body.server,
                urlOrFileId: body.urlOrFileId,
            });
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete<{ Params: { sourceId: string } }>(
        prefixUrl("/vault/sources/:sourceId"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await vaultUseCases.deleteSource.execute(request.user!.id, request.params.sourceId);
            if (result.isError()) return sendVaultError(reply, result.error);
            return reply.status(204).send();
        },
    );
};


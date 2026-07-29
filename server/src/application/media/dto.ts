import type { FileEntity } from "@domain/entities/File";
import type { FileDto } from "@ania/api-contract/media";

export type { FileDto, UploadMediaResult } from "@ania/api-contract/media";

export function toFileDto(file: FileEntity): FileDto {
    return {
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        size: file.size,
        url: file.url,
        isPrivate: file.isPrivate,
    };
}

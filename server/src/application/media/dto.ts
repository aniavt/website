import type { FileEntity } from "@domain/entities/File";

export interface FileDto {
    readonly id: string;
    readonly name: string;
    readonly contentType: string;
    readonly size: number;
    readonly url: string;
    readonly isPrivate: boolean;
}

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


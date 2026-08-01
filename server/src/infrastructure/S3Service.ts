import { FileEntity } from "@domain/entities/File";
import type { ObjectStorage, UploadParams } from "@domain/services/ObjectStorage";
import type { IdGenerator } from "@domain/services/IdGenerator";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service implements ObjectStorage {
  constructor(
    private readonly s3Client: S3Client,
    private readonly s3SigningClient: S3Client,
    private readonly bucketName: string,
    private readonly idGenerator: IdGenerator,
  ) {}

  async upload({
    name,
    contentType,
    size,
    body,
  }: UploadParams): Promise<FileEntity> {
    const id = this.idGenerator.generateUUID();
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: id,
      Body: body,
      ACL: "public-read",
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return new FileEntity({
      id,
      contentType,
      name,
      size,
      url: `/api/media/${id}`,
    });
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: id,
    });

    await this.s3Client.send(command);
  }

  async getObjectUrl(id: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: id,
    });

    return await getSignedUrl(this.s3SigningClient, command, {
      expiresIn: 300,
    });
  }
}

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeInBytes?: number; // default 5MB
  allowedMimeTypes?: string[]; // default image/jpeg, image/png, image/webp, application/pdf
}

export interface UploadFilePayload {
  fieldname?: string;
  originalname?: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(options?: FileValidationOptions) {
    this.maxSize = options?.maxSizeInBytes ?? 5 * 1024 * 1024; // 5 MB
    this.allowedMimeTypes = options?.allowedMimeTypes ?? [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
  }

  transform(file: UploadFilePayload | undefined) {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'File is required' });
    }

    if (file.size > this.maxSize) {
      const maxMb = Math.round(this.maxSize / (1024 * 1024));
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds the maximum limit of ${maxMb}MB`,
      });
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file MIME type '${file.mimetype}'. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      });
    }

    return file;
  }
}

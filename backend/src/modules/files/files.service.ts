import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentExtractionService } from './document-extraction.service';
import { ExtractionResult } from './document-extraction.util';

export interface StoredFile {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  uploadedBy: string;
}

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly maxFileSizeBytes: number;
  private readonly allowedTypes: string[];
  private readonly logger = new Logger('FilesService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly documentExtractionService: DocumentExtractionService,
  ) {
    this.uploadPath = this.configService.get<string>('app.storage.localUploadPath', './uploads');
    this.maxFileSizeBytes =
      this.configService.get<number>('app.storage.maxFileSizeMb', 10) * 1024 * 1024;
    this.allowedTypes = this.configService.get<string[]>('app.storage.allowedFileTypes', [
      'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg',
    ]);
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const dirs = ['resumes', 'certificates', 'jds', 'projects', 'photos', 'misc'];
    dirs.forEach((dir) => {
      const dirPath = path.join(this.uploadPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  private getCategoryDir(category: FileCategory): string {
    const dirMap: Record<FileCategory, string> = {
      RESUME: 'resumes',
      CERTIFICATE: 'certificates',
      JD_DOCUMENT: 'jds',
      PROJECT_DOCUMENT: 'projects',
      PROFILE_PHOTO: 'photos',
      OTHER: 'misc',
    };
    return dirMap[category] || 'misc';
  }

  validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxFileSizeBytes / 1024 / 1024}MB`,
      );
    }
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!this.allowedTypes.includes(ext)) {
      throw new BadRequestException(
        `File type .${ext} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`,
      );
    }
  }

  async saveFile(
    file: Express.Multer.File,
    category: FileCategory,
    uploadedBy: string,
  ): Promise<StoredFile> {
    this.validateFile(file);

    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const categoryDir = this.getCategoryDir(category);
    const relativePath = path.join(categoryDir, storedName);
    const absolutePath = path.join(this.uploadPath, relativePath);

    fs.writeFileSync(absolutePath, file.buffer);

    const record = await this.prisma.uploadedFile.create({
      data: {
        originalName: file.originalname,
        storedName,
        path: relativePath,
        mimeType: file.mimetype,
        size: file.size,
        category,
        uploadedBy,
      },
    });

    this.logger.log(`File saved: ${relativePath} (${file.size} bytes)`);
    return record;
  }

  async getFile(fileId: string): Promise<{ record: any; absolutePath: string }> {
    const record = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!record) throw new NotFoundException('File not found');

    const absolutePath = path.join(this.uploadPath, record.path);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('File not found on disk');
    }
    return { record, absolutePath };
  }

  async deleteFile(fileId: string): Promise<void> {
    const { record, absolutePath } = await this.getFile(fileId);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    await this.prisma.uploadedFile.delete({ where: { id: record.id } });
  }

  // Extract raw text from PDF or DOCX
  async extractDocumentFromFile(fileId: string): Promise<ExtractionResult> {
    const { record, absolutePath } = await this.getFile(fileId);
    return this.documentExtractionService.extractFromFile(absolutePath, record.originalName);
  }

  async extractTextFromFile(fileId: string): Promise<string> {
    const extraction = await this.extractDocumentFromFile(fileId);
    if (!extraction.text) {
      throw new BadRequestException('Could not extract readable text from this file');
    }
    return extraction.text;
  }

  getPublicUrl(filePath: string): string {
    // For MVP: construct local URL. Replace with S3 URL in production.
    return `/uploads/${filePath}`;
  }
}

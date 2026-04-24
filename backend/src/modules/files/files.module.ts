import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { DocumentExtractionService } from './document-extraction.service';

@Global()
@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage, we handle disk writes ourselves
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB global limit
    }),
  ],
  providers: [FilesService, DocumentExtractionService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}

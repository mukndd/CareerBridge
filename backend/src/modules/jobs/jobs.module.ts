import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { SkillsModule } from '../skills/skills.module';
import { FilesModule } from '../files/files.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [SkillsModule, FilesModule, MatchingModule],
  providers: [JobsService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}

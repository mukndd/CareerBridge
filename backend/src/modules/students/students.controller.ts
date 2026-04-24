import {
  Controller, Get, Put, Post, Delete, Body, Param,
  Query, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import type { ProjectReviewResult, CertificationReviewResult } from './students.service';
import { UpdateStudentProfileDto } from './dto/update-profile.dto';
import { CreateAchievementDto, UpdateAchievementDto } from './dto/achievement.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/certification.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { SkillsService } from '../skills/skills.service';

@ApiTags('Students')
@ApiBearerAuth()
@Roles(Role.STUDENT)
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly skillsService: SkillsService,
  ) {}

  // ─── Profile ───────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get my full student profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.studentsService.getProfile(user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update student profile' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(user.sub, dto);
  }

  @Get('me/skills')
  @ApiOperation({ summary: 'Get my extracted skills grouped by category' })
  async getMySkills(@CurrentUser() user: JwtPayload) {
    const profile = await this.studentsService.ensureProfile(user.sub);
    return this.skillsService.getStudentSkillsByCategory(profile.id);
  }

  // ─── Achievements ───────────────────────────────

  @Post('me/achievements')
  @ApiOperation({ summary: 'Add an achievement (hackathon, internship, award, etc.)' })
  createAchievement(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAchievementDto,
  ) {
    return this.studentsService.createAchievement(user.sub, dto);
  }

  @Put('me/achievements/:id')
  @ApiOperation({ summary: 'Update an achievement' })
  updateAchievement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAchievementDto,
  ) {
    return this.studentsService.updateAchievement(user.sub, id, dto);
  }

  @Delete('me/achievements/:id')
  @ApiOperation({ summary: 'Delete an achievement' })
  deleteAchievement(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.studentsService.deleteAchievement(user.sub, id);
  }

  // ─── Projects ───────────────────────────────

  @Post('me/projects')
  @ApiOperation({ summary: 'Add a project (auto-extracts skills from description + tech stack)' })
  createProject(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.studentsService.createProject(user.sub, dto);
  }

  @Post('me/projects/review')
  @ApiOperation({ summary: 'Review a project draft before saving' })
  reviewProject(@Body() dto: CreateProjectDto): Promise<ProjectReviewResult> {
    return this.studentsService.reviewProject(dto);
  }

  @Put('me/projects/:id')
  @ApiOperation({ summary: 'Update a project' })
  updateProject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.studentsService.updateProject(user.sub, id, dto);
  }

  @Delete('me/projects/:id')
  @ApiOperation({ summary: 'Delete a project' })
  deleteProject(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.studentsService.deleteProject(user.sub, id);
  }

  // ─── Certifications ───────────────────────────────

  @Post('me/certifications')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Add a certification (optionally with certificate file upload)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Certification details + optional certificate file' })
  createCertification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCertificationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.studentsService.createCertification(user.sub, dto, file);
  }

  @Post('me/certifications/review')
  @ApiOperation({ summary: 'Review a certification draft before saving' })
  reviewCertification(@Body() dto: CreateCertificationDto): Promise<CertificationReviewResult> {
    return this.studentsService.reviewCertification(dto);
  }

  @Put('me/certifications/:id')
  @ApiOperation({ summary: 'Update a certification' })
  updateCertification(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.studentsService.updateCertification(user.sub, id, dto);
  }

  @Delete('me/certifications/:id')
  @ApiOperation({ summary: 'Delete a certification' })
  deleteCertification(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.studentsService.deleteCertification(user.sub, id);
  }

  // ─── Applications ───────────────────────────────

  @Get('me/applications')
  @ApiOperation({ summary: 'Get my job applications with status' })
  getMyApplications(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.studentsService.getMyApplications(user.sub, pagination);
  }

  @Post('me/applications/:jobId')
  @ApiOperation({ summary: 'Apply to a job' })
  applyToJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() body: { resumeId?: string },
  ) {
    return this.studentsService.applyToJob(user.sub, jobId, body.resumeId);
  }

  @Get('me/applications/:jobId/match')
  @ApiOperation({ summary: 'Get my match score for a specific job' })
  getJobMatch(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
    return this.studentsService.getJobMatchForStudent(user.sub, jobId);
  }
}

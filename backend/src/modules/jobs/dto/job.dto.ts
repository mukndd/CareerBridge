import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsArray,
  IsEnum, IsNumber, IsInt, Min, Max, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, JobStatus } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'uuid-of-company' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'Software Engineer - Backend' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We are looking for a backend engineer...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: ['Design and develop RESTful APIs', 'Work with cloud infrastructure'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @ApiPropertyOptional({ example: 'Bengaluru, Karnataka' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ctcMin?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ctcMax?: number;

  @ApiPropertyOptional({ example: ['CSE', 'ISE', 'AI&DS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleBranches?: string[];

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  minCgpa?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxBacklogs?: number;

  @ApiPropertyOptional({ example: [2025, 2026] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  allowedGraduationYears?: number[];

  @ApiPropertyOptional({ example: ['Node.js', 'PostgreSQL', 'AWS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: ['Docker', 'Redis', 'GraphQL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  driveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalEligibilityNotes?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawJdText?: string;

  @ApiPropertyOptional({ example: ['backend', 'cloud', 'distributed systems'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class UpdateJobDto extends CreateJobDto {}

-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "isForged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "match_results" ADD COLUMN     "boost" DOUBLE PRECISION,
ADD COLUMN     "fairnessAudit" JSONB,
ADD COLUMN     "gpaOn4" DOUBLE PRECISION,
ADD COLUMN     "overlap" DOUBLE PRECISION,
ADD COLUMN     "rawGpa" DOUBLE PRECISION,
ADD COLUMN     "rawGpaScale" DOUBLE PRECISION,
ADD COLUMN     "rawScore" DOUBLE PRECISION,
ADD COLUMN     "scoreExplanation" JSONB,
ADD COLUMN     "treScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "gpaScale" DOUBLE PRECISION NOT NULL DEFAULT 10;

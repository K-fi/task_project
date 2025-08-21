-- DropForeignKey
ALTER TABLE "ProgressLog" DROP CONSTRAINT "ProgressLog_taskId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionLog" DROP CONSTRAINT "SubmissionLog_taskId_fkey";

-- AlterTable
ALTER TABLE "ProgressLog" ADD COLUMN     "taskTitle" TEXT;

-- AddForeignKey
ALTER TABLE "SubmissionLog" ADD CONSTRAINT "SubmissionLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

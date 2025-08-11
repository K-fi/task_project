-- DropForeignKey
ALTER TABLE "ProgressLog" DROP CONSTRAINT "ProgressLog_taskId_fkey";

-- AlterTable
ALTER TABLE "ProgressLog" ALTER COLUMN "taskId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProgressLog" ADD CONSTRAINT "ProgressLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

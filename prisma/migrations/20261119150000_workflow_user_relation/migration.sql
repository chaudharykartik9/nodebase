-- Existing rows are tutorial test data without an owner. They cannot satisfy the
-- new NOT NULL "userId" column, so they are removed first.
DELETE FROM "workflow";

-- AlterTable
ALTER TABLE "workflow" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "workflow_userId_idx" ON "workflow"("userId");

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

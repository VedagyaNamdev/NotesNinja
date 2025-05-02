/*
  Warnings:

  - You are about to drop the column `note_id` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `revisions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[attachment_id]` on the table `notes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_note_id_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_userId_fkey";

-- DropForeignKey
ALTER TABLE "revisions" DROP CONSTRAINT "revisions_note_id_fkey";

-- DropForeignKey
ALTER TABLE "revisions" DROP CONSTRAINT "revisions_user_id_fkey";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "note_id";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "attachment_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "updatedAt",
ADD COLUMN     "last_sign_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "revisions";

-- CreateIndex
CREATE UNIQUE INDEX "notes_attachment_id_key" ON "notes"("attachment_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

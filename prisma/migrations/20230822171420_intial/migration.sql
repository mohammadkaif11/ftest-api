/*
  Warnings:

  - You are about to drop the column `Content` on the `Ftest` table. All the data in the column will be lost.
  - You are about to drop the column `Header` on the `Ftest` table. All the data in the column will be lost.
  - Added the required column `HeaderContent` to the `Ftest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HeaderDescription` to the `Ftest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ftest" DROP COLUMN "Content",
DROP COLUMN "Header",
ADD COLUMN     "HeaderContent" TEXT NOT NULL,
ADD COLUMN     "HeaderDescription" TEXT NOT NULL;

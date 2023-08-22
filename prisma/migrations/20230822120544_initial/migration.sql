-- CreateTable
CREATE TABLE "Ftest" (
    "id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Header" TEXT NOT NULL,
    "Content" TEXT NOT NULL,

    CONSTRAINT "Ftest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "ftestId" INTEGER NOT NULL,
    "Label" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" SERIAL NOT NULL,
    "festId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "festId" INTEGER NOT NULL,
    "Tag" TEXT NOT NULL,
    "Header" TEXT NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureNameAndDescription" (
    "id" SERIAL NOT NULL,
    "FeatureId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "FeatureNameAndDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cta" (
    "id" SERIAL NOT NULL,
    "festId" INTEGER NOT NULL,
    "Header" TEXT NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "Cta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_festId_key" ON "Feature"("festId");

-- CreateIndex
CREATE UNIQUE INDEX "Cta_festId_key" ON "Cta"("festId");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_ftestId_fkey" FOREIGN KEY ("ftestId") REFERENCES "Ftest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stats" ADD CONSTRAINT "Stats_festId_fkey" FOREIGN KEY ("festId") REFERENCES "Ftest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_festId_fkey" FOREIGN KEY ("festId") REFERENCES "Ftest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureNameAndDescription" ADD CONSTRAINT "FeatureNameAndDescription_FeatureId_fkey" FOREIGN KEY ("FeatureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cta" ADD CONSTRAINT "Cta_festId_fkey" FOREIGN KEY ("festId") REFERENCES "Ftest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

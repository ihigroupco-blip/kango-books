-- CreateEnum
CREATE TYPE "TripClassification" AS ENUM ('BUSINESS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FUEL', 'TOLLS', 'PARKING', 'MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'OTHER');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "rego" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "currentOdometer" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookPeriod" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "businessPct" DECIMAL(5,2),
    "totalKm" INTEGER,
    "businessKm" INTEGER,
    "privateKm" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogbookPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "logbookPeriodId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startOdometer" INTEGER NOT NULL,
    "endOdometer" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "classification" "TripClassification" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleExpense" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fbtYear" INTEGER NOT NULL,
    "startReading" INTEGER NOT NULL,
    "endReading" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdometerReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_rego_userId_key" ON "Vehicle"("rego", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OdometerReading_vehicleId_fbtYear_key" ON "OdometerReading"("vehicleId", "fbtYear");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookPeriod" ADD CONSTRAINT "LogbookPeriod_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_logbookPeriodId_fkey" FOREIGN KEY ("logbookPeriodId") REFERENCES "LogbookPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

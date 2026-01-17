-- CreateEnum
CREATE TYPE "RFPStatus" AS ENUM ('DRAFT', 'SENT', 'EVALUATING', 'AWARDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFP" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryDays" INTEGER,
    "paymentTerms" TEXT,
    "warrantyMonths" INTEGER,
    "status" "RFPStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFPItem" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFPItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFPVendor" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "SendStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "RFPVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "rawEmail" TEXT NOT NULL,
    "rawSubject" TEXT,
    "parsedData" JSONB,
    "totalPrice" DOUBLE PRECISION,
    "unitPrices" JSONB,
    "deliveryDays" INTEGER,
    "warranty" TEXT,
    "paymentTerms" TEXT,
    "aiScore" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "aiStrengths" JSONB,
    "aiWeaknesses" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RFPVendor_rfpId_vendorId_key" ON "RFPVendor"("rfpId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_rfpId_vendorId_key" ON "Proposal"("rfpId", "vendorId");

-- AddForeignKey
ALTER TABLE "RFPItem" ADD CONSTRAINT "RFPItem_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFPVendor" ADD CONSTRAINT "RFPVendor_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFPVendor" ADD CONSTRAINT "RFPVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

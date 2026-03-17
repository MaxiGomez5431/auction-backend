/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Auction` table. All the data in the column will be lost.
  - You are about to drop the column `currentBid` on the `Auction` table. All the data in the column will be lost.
  - You are about to drop the column `minIncrement` on the `Auction` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minimumIncrement` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingPrice` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Auction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artworkId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startingPrice" REAL NOT NULL,
    "minimumIncrement" REAL NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "currentBidId" INTEGER,
    CONSTRAINT "Auction_currentBidId_fkey" FOREIGN KEY ("currentBidId") REFERENCES "Bid" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Auction_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Auction" ("artworkId", "id", "status") SELECT "artworkId", "id", "status" FROM "Auction";
DROP TABLE "Auction";
ALTER TABLE "new_Auction" RENAME TO "Auction";
CREATE UNIQUE INDEX "Auction_artworkId_key" ON "Auction"("artworkId");
CREATE UNIQUE INDEX "Auction_currentBidId_key" ON "Auction"("currentBidId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("email", "id", "isVerified", "password") SELECT "email", "id", "isVerified", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Bid_auctionId_createdAt_idx" ON "Bid"("auctionId", "createdAt");

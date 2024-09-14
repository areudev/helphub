/*
  Warnings:

  - You are about to drop the column `itemsCount` on the `AnnouncementItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnnouncementItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AnnouncementItem_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AnnouncementItem" ("announcementId", "id", "itemId", "quantity") SELECT "announcementId", "id", "itemId", "quantity" FROM "AnnouncementItem";
DROP TABLE "AnnouncementItem";
ALTER TABLE "new_AnnouncementItem" RENAME TO "AnnouncementItem";
CREATE UNIQUE INDEX "AnnouncementItem_announcementId_itemId_key" ON "AnnouncementItem"("announcementId", "itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

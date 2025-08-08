/*
  Warnings:

  - Made the column `source` on table `Link` required. This step will fail if there are existing NULL values in that column.
  - Made the column `target` on table `Link` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    CONSTRAINT "Link_source_fkey" FOREIGN KEY ("source") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_target_fkey" FOREIGN KEY ("target") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Link" ("id", "source", "target") SELECT "id", "source", "target" FROM "Link";
DROP TABLE "Link";
ALTER TABLE "new_Link" RENAME TO "Link";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

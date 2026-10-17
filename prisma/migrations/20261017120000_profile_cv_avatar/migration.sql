-- AlterTable: downloadable assets for the public site (CV per language, avatar)
ALTER TABLE "Profile" ADD COLUMN "cvEnUrl" TEXT NOT NULL DEFAULT '/cv/Anugerah_Fakhriza_Reswara_CV_EN.pdf';
ALTER TABLE "Profile" ADD COLUMN "cvIdUrl" TEXT NOT NULL DEFAULT '/cv/Anugerah_Fakhriza_Reswara_CV_ID.pdf';
ALTER TABLE "Profile" ADD COLUMN "avatarUrl" TEXT NOT NULL DEFAULT '';

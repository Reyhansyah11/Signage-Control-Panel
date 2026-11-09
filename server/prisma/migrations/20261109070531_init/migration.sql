-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('image', 'video', 'text', 'url');

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'offline',
    "last_seen" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tipe" "ContentType" NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "durasi_detik" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_device_id_content_id_key" ON "playlist_items"("device_id", "content_id");

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

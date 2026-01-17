/*
  Warnings:

  - You are about to drop the column `user_id` on the `stores` table. All the data in the column will be lost.
  - Added the required column `company_id` to the `stores` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_user_id_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "manage_stock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "product_type" TEXT NOT NULL DEFAULT 'simple';

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "user_id",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "is_syncing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sync_orders_count" INTEGER,
ADD COLUMN     "sync_products_count" INTEGER,
ADD COLUMN     "sync_step" TEXT,
ADD COLUMN     "sync_variations_count" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_company_id" TEXT,
ADD COLUMN     "email_verification_code" TEXT,
ADD COLUMN     "email_verification_expiry" TIMESTAMP(3),
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'MEMBER',
    "invite_token" TEXT,
    "invite_status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "wc_variation_id" INTEGER NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "stock_status" TEXT NOT NULL DEFAULT 'instock',
    "manage_stock" BOOLEAN NOT NULL DEFAULT false,
    "attributes" JSONB,
    "attribute_string" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings_logs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_settings_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_invite_token_key" ON "company_members"("invite_token");

-- CreateIndex
CREATE INDEX "company_members_invite_token_idx" ON "company_members"("invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_company_id_email_key" ON "company_members"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "product_variations_product_id_wc_variation_id_key" ON "product_variations"("product_id", "wc_variation_id");

-- CreateIndex
CREATE INDEX "store_settings_logs_store_id_idx" ON "store_settings_logs"("store_id");

-- CreateIndex
CREATE INDEX "store_settings_logs_user_id_idx" ON "store_settings_logs"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_company_id_fkey" FOREIGN KEY ("current_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

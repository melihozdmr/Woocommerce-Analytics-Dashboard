-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_ORDER', 'CRITICAL_STOCK', 'HIGH_VALUE_ORDER', 'REFUND_RECEIVED', 'SYNC_ERROR', 'DAILY_REPORT', 'WEEKLY_REPORT');

-- AlterEnum
ALTER TYPE "CompanyRole" ADD VALUE 'STOCKIST';

-- AlterTable stores - add wcsc columns
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "wcsc_api_key" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "wcsc_api_secret" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "wcsc_webhook_secret" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "has_wcsc_plugin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "wcsc_connected_at" TIMESTAMP(3);
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "wcsc_last_sync_at" TIMESTAMP(3);

-- AlterTable products - add image_url
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- AlterTable product_variations - add purchase_price
ALTER TABLE "product_variations" ADD COLUMN IF NOT EXISTS "purchase_price" DECIMAL(10,2);

-- CreateTable notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable notification_settings
CREATE TABLE IF NOT EXISTS "notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "threshold_value" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable order_items
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "wc_product_id" INTEGER NOT NULL,
    "product_id" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable refunds
CREATE TABLE IF NOT EXISTS "refunds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "wc_refund_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "refund_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable api_keys
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "rate_limit" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable api_usage_logs
CREATE TABLE IF NOT EXISTS "api_usage_logs" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable webhook_logs
CREATE TABLE IF NOT EXISTS "webhook_logs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_mappings
CREATE TABLE IF NOT EXISTS "product_mappings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "master_sku" TEXT NOT NULL,
    "total_stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_mapping_items
CREATE TABLE IF NOT EXISTS "product_mapping_items" (
    "id" TEXT NOT NULL,
    "mapping_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_mapping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable dismissed_mapping_suggestions
CREATE TABLE IF NOT EXISTS "dismissed_mapping_suggestions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "suggestion_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dismissed_mapping_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for notifications
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndexes for notification_settings
CREATE UNIQUE INDEX IF NOT EXISTS "notification_settings_user_id_notification_type_key" ON "notification_settings"("user_id", "notification_type");
CREATE INDEX IF NOT EXISTS "notification_settings_user_id_idx" ON "notification_settings"("user_id");

-- CreateIndexes for order_items
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx" ON "order_items"("product_id");
CREATE INDEX IF NOT EXISTS "order_items_wc_product_id_idx" ON "order_items"("wc_product_id");

-- CreateIndexes for refunds
CREATE INDEX IF NOT EXISTS "refunds_order_id_idx" ON "refunds"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "refunds_order_id_wc_refund_id_key" ON "refunds"("order_id", "wc_refund_id");
CREATE INDEX IF NOT EXISTS "refunds_refund_date_idx" ON "refunds"("refund_date");

-- CreateIndexes for api_keys
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_company_id_idx" ON "api_keys"("company_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndexes for api_usage_logs
CREATE INDEX IF NOT EXISTS "api_usage_logs_api_key_id_created_at_idx" ON "api_usage_logs"("api_key_id", "created_at");
CREATE INDEX IF NOT EXISTS "api_usage_logs_created_at_idx" ON "api_usage_logs"("created_at");

-- CreateIndexes for webhook_logs
CREATE INDEX IF NOT EXISTS "webhook_logs_store_id_created_at_idx" ON "webhook_logs"("store_id", "created_at");
CREATE INDEX IF NOT EXISTS "webhook_logs_event_type_idx" ON "webhook_logs"("event_type");
CREATE INDEX IF NOT EXISTS "webhook_logs_created_at_idx" ON "webhook_logs"("created_at");

-- CreateIndexes for product_mappings
CREATE UNIQUE INDEX IF NOT EXISTS "product_mappings_company_id_master_sku_key" ON "product_mappings"("company_id", "master_sku");
CREATE INDEX IF NOT EXISTS "product_mappings_company_id_idx" ON "product_mappings"("company_id");

-- CreateIndexes for product_mapping_items
CREATE UNIQUE INDEX IF NOT EXISTS "product_mapping_items_mapping_id_store_id_product_id_key" ON "product_mapping_items"("mapping_id", "store_id", "product_id");
CREATE INDEX IF NOT EXISTS "product_mapping_items_mapping_id_idx" ON "product_mapping_items"("mapping_id");
CREATE INDEX IF NOT EXISTS "product_mapping_items_store_id_idx" ON "product_mapping_items"("store_id");
CREATE INDEX IF NOT EXISTS "product_mapping_items_product_id_idx" ON "product_mapping_items"("product_id");

-- CreateIndexes for dismissed_mapping_suggestions
CREATE UNIQUE INDEX IF NOT EXISTS "dismissed_mapping_suggestions_company_id_suggestion_key_key" ON "dismissed_mapping_suggestions"("company_id", "suggestion_key");
CREATE INDEX IF NOT EXISTS "dismissed_mapping_suggestions_company_id_idx" ON "dismissed_mapping_suggestions"("company_id");

-- AddForeignKey notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey notification_settings
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey order_items
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey refunds
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey api_keys
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey api_usage_logs
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey webhook_logs
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey product_mappings
ALTER TABLE "product_mappings" ADD CONSTRAINT "product_mappings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey product_mapping_items
ALTER TABLE "product_mapping_items" ADD CONSTRAINT "product_mapping_items_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "product_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_mapping_items" ADD CONSTRAINT "product_mapping_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_mapping_items" ADD CONSTRAINT "product_mapping_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey dismissed_mapping_suggestions
ALTER TABLE "dismissed_mapping_suggestions" ADD CONSTRAINT "dismissed_mapping_suggestions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

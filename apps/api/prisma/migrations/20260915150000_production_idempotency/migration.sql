-- Idempotency is enforced by the database, not just application memory.
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Order'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'idempotencyKey'
        ) THEN
            ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
        END IF;
        IF NOT EXISTS (
            SELECT FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'Order_idempotencyKey_key'
        ) THEN
            CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
        END IF;
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'PaymentTransaction'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'PaymentTransaction_type_key'
        ) THEN
            CREATE UNIQUE INDEX "PaymentTransaction_type_key" ON "PaymentTransaction"("type");
        END IF;
    END IF;
END $$;
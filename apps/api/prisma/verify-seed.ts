import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.loadEnvFile('.env');
}

const prisma = new PrismaClient();

async function verifySeed(): Promise<void> {
  console.log('🔍 Running Post-Seed Database Verification & Data Integrity Checks...\n');

  let passed = true;

  // 1. Categories & Subcategories Count
  const totalCategories = await prisma.category.count();
  const parentCategories = await prisma.category.count({ where: { parentId: null } });
  const subCategories = await prisma.category.count({ where: { NOT: { parentId: null } } });

  console.log(`📂 Categories: Total = ${totalCategories} (Top-level: ${parentCategories}, Subcategories: ${subCategories})`);
  if (totalCategories < 15) {
    console.error('❌ ERROR: Expected at least 15 categories.');
    passed = false;
  }

  // 2. Product Counts
  const totalProducts = await prisma.product.count();
  const groceryProducts = await prisma.product.count({ where: { isMedicine: false } });
  const medicineProducts = await prisma.product.count({ where: { isMedicine: true } });
  const rxProducts = await prisma.product.count({ where: { isPrescriptionRequired: true } });

  console.log(`📦 Products: Total = ${totalProducts} (Grocery: ${groceryProducts}, Pharmacy: ${medicineProducts}, Rx Required: ${rxProducts})`);
  if (totalProducts < 40) {
    console.error('❌ ERROR: Expected substantial catalog products.');
    passed = false;
  }

  // 3. Duplicate SKU Check
  const products = await prisma.product.findMany({ select: { id: true, sku: true, name: true, price: true, compareAtPrice: true, images: true } });
  const skus = products.map((p) => p.sku);
  const uniqueSkus = new Set(skus);
  if (skus.length !== uniqueSkus.size) {
    console.error(`❌ ERROR: Found duplicate SKUs! Total: ${skus.length}, Unique: ${uniqueSkus.size}`);
    passed = false;
  } else {
    console.log(`✅ SKUs: ${uniqueSkus.size} unique SKUs validated.`);
  }

  // 4. Pricing & Discount Calculation Integrity (sellingPrice <= compareAtPrice)
  let priceViolations = 0;
  for (const p of products) {
    const price = Number(p.price);
    const mrp = p.compareAtPrice ? Number(p.compareAtPrice) : price;
    if (price > mrp) {
      console.error(`❌ ERROR: Price violation on ${p.name} (SKU: ${p.sku}) - Price ₹${price} > MRP ₹${mrp}`);
      priceViolations++;
      passed = false;
    }
  }
  if (priceViolations === 0) {
    console.log(`✅ Pricing: All products satisfy sellingPrice <= MRP (compareAtPrice).`);
  }

  // 5. Variants Check
  const variantsCount = await prisma.productVariant.count();
  console.log(`🔀 Product Variants: ${variantsCount} variants created.`);

  // 6. Inventory Check
  const totalInventoryItems = await prisma.inventoryItem.count();
  const inStockItems = await prisma.inventoryItem.count({ where: { quantity: { gt: 0 } } });
  console.log(`📊 Inventory: ${totalInventoryItems} inventory records seeded (${inStockItems} in stock).`);

  // 7. Image Check
  const imagesCount = await prisma.productImage.count();
  const primaryImagesCount = await prisma.productImage.count({ where: { isPrimary: true } });
  console.log(`🖼️ Images: Total = ${imagesCount} (Primary: ${primaryImagesCount})`);
  if (primaryImagesCount < totalProducts) {
    console.warn(`⚠️ WARNING: Some products do not have a primary image.`);
  } else {
    console.log(`✅ Images: Every product has a primary image assigned.`);
  }

  console.log('\n==================================================');
  if (passed) {
    console.log('🎉 SEED VERIFICATION COMPLETE: ALL INTEGRITY CHECKS PASSED!');
  } else {
    console.error('❌ SEED VERIFICATION FAILED: Integrity errors detected.');
    process.exit(1);
  }
  console.log('==================================================\n');
}

verifySeed()
  .catch((err) => {
    console.error('Fatal verification error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

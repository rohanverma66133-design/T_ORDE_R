import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.loadEnvFile('.env');
}

const prisma = new PrismaClient();

async function auditMedicalDatabase(): Promise<void> {
  console.log('==================================================');
  console.log('📋 AUDITING EXISTING MEDICAL DATABASE RECORDS');
  console.log('==================================================\n');

  const medProducts = await prisma.product.findMany({
    where: { isMedicine: true },
    include: { category: true, images: true, store: true, pharmacy: true },
  });

  console.log(`Total Medical/Pharmacy Products in DB: ${medProducts.length}\n`);

  // 1. Image reuse analysis
  const imageToProductsMap = new Map<string, Array<{ sku: string; name: string; category: string }>>();

  for (const p of medProducts) {
    const primaryImg = p.images.find((i) => i.isPrimary)?.url || p.images[0]?.url || 'NO_IMAGE';
    if (!imageToProductsMap.has(primaryImg)) {
      imageToProductsMap.set(primaryImg, []);
    }
    imageToProductsMap.get(primaryImg)!.push({
      sku: p.sku,
      name: p.name,
      category: p.category?.name || 'Uncategorized',
    });
  }

  console.log('🚨 1. IMAGE REUSE AUDIT REPORT:');
  let duplicateImageCount = 0;
  for (const [url, products] of imageToProductsMap.entries()) {
    if (products.length > 1) {
      duplicateImageCount++;
      console.log(`\n❌ DUPLICATE IMAGE URL (${products.length} products sharing):`);
      console.log(`   URL: ${url}`);
      for (const pr of products) {
        console.log(`   - [${pr.sku}] ${pr.name} (Category: ${pr.category})`);
      }
    }
  }

  // 2. Specific problematic records check
  console.log('\n🚨 2. SPECIFIC DEVICE IMAGE MISMATCHES IDENTIFIED:');
  const targetCheckNames = [
    'Dr Trust Waterproof Digital Flexible Tip Thermometer',
    'Omron HEM-7120 Digital Blood Pressure Monitor',
    'Hansaplast Waterproof Medicated Bandages',
  ];

  for (const name of targetCheckNames) {
    const found = medProducts.filter((p) => p.name.includes(name) || name.includes(p.name));
    for (const f of found) {
      const img = f.images.find((i) => i.isPrimary)?.url || f.images[0]?.url || 'NONE';
      console.log(`\n❌ MISMATCH RECORD FOUND:`);
      console.log(`   SKU: ${f.sku}`);
      console.log(`   Name: ${f.name}`);
      console.log(`   Brand: ${f.brand}`);
      console.log(`   Category: ${f.category?.name}`);
      console.log(`   Image URL: ${img}`);
      if (img.includes('1584308666744-24d5c474f2ae') || img.includes('photo-1584308666744')) {
        console.log(`   🚨 ISSUE DETECTED: Device product is using a generic pills/blister pack photo!`);
      }
    }
  }

  // 3. Category & Taxonomy audit
  console.log('\n🚨 3. CATEGORY TAXONOMY AUDIT:');
  const categoriesUsed = new Set(medProducts.map((p) => p.category?.name));
  console.log(`   Categories currently used for medical items: ${Array.from(categoriesUsed).join(', ')}`);

  console.log('\n==================================================');
  console.log('AUDIT SUMMARY COMPLETE');
  console.log('==================================================\n');
}

auditMedicalDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

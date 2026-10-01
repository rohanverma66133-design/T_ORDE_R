import {
  PrismaClient,
  RoleCode,
  type Prisma,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

if (!process.env.DATABASE_URL) {
  process.loadEnvFile('.env');
}

const prisma = new PrismaClient();

const permissions = [
  { code: 'users.read', name: 'Read users' },
  { code: 'users.write', name: 'Write users' },
  { code: 'orders.read', name: 'Read orders' },
  { code: 'orders.write', name: 'Write orders' },
  { code: 'catalog.read', name: 'Read catalog' },
  { code: 'catalog.write', name: 'Write catalog' },
  { code: 'prescriptions.read', name: 'Read prescriptions' },
  { code: 'prescriptions.verify', name: 'Verify prescriptions' },
  { code: 'delivery.read', name: 'Read deliveries' },
  { code: 'delivery.write', name: 'Update delivery status' },
  { code: 'support.read', name: 'Read support' },
  { code: 'support.write', name: 'Write support' },
  { code: 'admin.access', name: 'Access admin panel' },
  { code: 'settings.write', name: 'Write settings' },
];

const roles: Array<{ code: RoleCode; name: string; permissionCodes: string[] }> = [
  {
    code: RoleCode.CUSTOMER,
    name: 'Customer',
    permissionCodes: ['catalog.read', 'orders.read', 'orders.write', 'prescriptions.read'],
  },
  {
    code: RoleCode.VENDOR_ADMIN,
    name: 'Grocery vendor admin',
    permissionCodes: ['catalog.read', 'catalog.write', 'orders.read', 'orders.write'],
  },
  {
    code: RoleCode.PHARMACY_ADMIN,
    name: 'Pharmacy admin',
    permissionCodes: ['catalog.read', 'catalog.write', 'orders.read', 'prescriptions.read', 'prescriptions.verify'],
  },
  {
    code: RoleCode.DELIVERY_PARTNER,
    name: 'Delivery partner',
    permissionCodes: ['orders.read', 'delivery.read', 'delivery.write'],
  },
  {
    code: RoleCode.SUPPORT_AGENT,
    name: 'Support agent',
    permissionCodes: ['support.read', 'support.write', 'users.read', 'orders.read', 'prescriptions.read'],
  },
  {
    code: RoleCode.ADMIN,
    name: 'Administrator',
    permissionCodes: permissions.map((item) => item.code).filter((code) => code !== 'settings.write'),
  },
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super administrator',
    permissionCodes: permissions.map((item) => item.code),
  },
];

async function main(): Promise<void> {
  console.log('🚀 Starting T-Ord Verified Seed Execution...');

  // 1. Permissions & Roles
  console.log('🔐 Seeding permissions and roles...');
  const permissionRecords = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { code: permission.code },
        update: { name: permission.name },
        create: permission,
      }),
    ),
  );

  const permissionByCode = new Map(permissionRecords.map((item) => [item.code, item]));

  for (const role of roles) {
    const record = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: record.id } });
    const data: Prisma.RolePermissionCreateManyInput[] = role.permissionCodes
      .map((code) => permissionByCode.get(code))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((permission) => ({ roleId: record.id, permissionId: permission.id }));
    if (data.length > 0) {
      await prisma.rolePermission.createMany({ data });
    }
  }

  // 2. System Settings
  console.log('⚙️ Seeding system settings...');
  const systemSettings = [
    { key: 'platform.name', value: { name: 'T-Ord Delivery' }, description: 'Platform display name' },
    { key: 'platform.deliveryFee', value: { baseFee: 25.0, perKmFee: 5.0, freeDeliveryThreshold: 499.0 }, description: 'Delivery pricing rules' },
    { key: 'platform.operatingHours', value: { open: '06:00', close: '23:00', timezone: 'Asia/Kolkata' }, description: 'Platform operational window' },
    { key: 'platform.supportHotline', value: { phone: '+91 1800-123-4567', email: 'support@tord.local' }, description: 'Customer support hotline' },
    { key: 'platform.taxConfig', value: { gstPercentage: 5.0, hsnPharmaGst: 12.0 }, description: 'Tax rules' },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  // 3. User Accounts & Hashes
  console.log('👥 Seeding users...');
  const defaultPasswordHash = await argon2.hash('Password123!', { type: argon2.argon2id });

  const roleMap = new Map<RoleCode, string>();
  for (const rCode of Object.values(RoleCode)) {
    const r = await prisma.role.findUnique({ where: { code: rCode } });
    if (r) roleMap.set(rCode, r.id);
  }

  async function createUser(email: string, phone: string, name: string, roleCode: RoleCode) {
    const roleId = roleMap.get(roleCode)!;
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, phone, passwordHash: defaultPasswordHash, status: UserStatus.ACTIVE },
      create: {
        email,
        phone,
        name,
        passwordHash: defaultPasswordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        roles: { create: { roleId } },
      },
    });
    return user;
  }

  const superAdmin = await createUser('admin@tord.local', '+919900000001', 'Super Administrator', RoleCode.SUPER_ADMIN);
  await createUser('support@tord.local', '+919900000002', 'Support Desk', RoleCode.SUPPORT_AGENT);
  const vendorAdminGrocery = await createUser('vendor.fresh@tord.local', '+919900000003', 'Fresh Market Manager', RoleCode.VENDOR_ADMIN);
  const vendorAdminDaily = await createUser('vendor.daily@tord.local', '+919900000004', 'Daily Pantry Admin', RoleCode.VENDOR_ADMIN);
  const pharmacyAdmin = await createUser('pharmacy.care@tord.local', '+919900000005', 'Chief Pharmacist', RoleCode.PHARMACY_ADMIN);

  const riderRahulUser = await createUser('rider.rahul@tord.local', '+919900000006', 'Rahul Sharma', RoleCode.DELIVERY_PARTNER);
  const riderPriyaUser = await createUser('rider.priya@tord.local', '+919900000007', 'Priya Verma', RoleCode.DELIVERY_PARTNER);

  const demoCustomer = await createUser('demo@tord.local', '+919876543210', 'John Doe', RoleCode.CUSTOMER);
  await createUser('ananya@tord.local', '+919876543211', 'Ananya Sharma', RoleCode.CUSTOMER);
  await createUser('vikram@tord.local', '+919876543212', 'Vikram Patel', RoleCode.CUSTOMER);

  // Delivery Profiles
  await prisma.deliveryPartner.upsert({
    where: { userId: riderRahulUser.id },
    update: { isActive: true, isAvailable: true, currentLocationLat: 21.1702, currentLocationLng: 72.8311 },
    create: {
      userId: riderRahulUser.id,
      vehicleType: 'BIKE',
      licenseNumber: 'DL-2026-88776',
      isActive: true,
      isAvailable: true,
      currentLocationLat: 21.1702,
      currentLocationLng: 72.8311,
      rating: 4.95,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { userId: riderPriyaUser.id },
    update: { isActive: true, isAvailable: true, currentLocationLat: 21.1750, currentLocationLng: 72.8350 },
    create: {
      userId: riderPriyaUser.id,
      vehicleType: 'ELECTRIC_SCOOTER',
      licenseNumber: 'DL-2026-99441',
      isActive: true,
      isAvailable: true,
      currentLocationLat: 21.1750,
      currentLocationLng: 72.8350,
      rating: 4.88,
    },
  });

  // Addresses
  console.log('📍 Seeding addresses...');
  await prisma.address.upsert({
    where: { id: 'demo-address-1' },
    update: {},
    create: {
      id: 'demo-address-1',
      userId: demoCustomer.id,
      label: 'Home',
      line1: 'Flat 402, Sunshine Heights, Main Street',
      line2: 'Sector 4, Town Center',
      city: 'Townsville',
      region: 'State',
      postalCode: '395007',
      country: 'IN',
      latitude: 21.1700,
      longitude: 72.8300,
      isDefault: true,
    },
  });

  const store1Address = await prisma.address.upsert({
    where: { id: 'store-address-1' },
    update: {},
    create: {
      id: 'store-address-1',
      userId: vendorAdminGrocery.id,
      label: 'Store Front',
      line1: 'Plot 12, Market Yard Complex',
      line2: 'Station Road',
      city: 'Townsville',
      region: 'State',
      postalCode: '395001',
      country: 'IN',
      latitude: 21.1650,
      longitude: 72.8250,
    },
  });

  const store2Address = await prisma.address.upsert({
    where: { id: 'store-address-2' },
    update: {},
    create: {
      id: 'store-address-2',
      userId: vendorAdminDaily.id,
      label: 'Daily Pantry Sector 4',
      line1: 'Shop 5, Shopping Plaza',
      line2: 'Sector 4',
      city: 'Townsville',
      region: 'State',
      postalCode: '395007',
      country: 'IN',
      latitude: 21.1710,
      longitude: 72.8320,
    },
  });

  const pharmacy1Address = await prisma.address.upsert({
    where: { id: 'pharmacy-address-1' },
    update: {},
    create: {
      id: 'pharmacy-address-1',
      userId: pharmacyAdmin.id,
      label: 'Town Care Pharmacy Main',
      line1: 'Opposite Civil Hospital',
      line2: 'Hospital Road',
      city: 'Townsville',
      region: 'State',
      postalCode: '395002',
      country: 'IN',
      latitude: 21.1680,
      longitude: 72.8280,
    },
  });

  // Vendors, Stores & Pharmacies
  console.log('🏪 Seeding vendors, stores, and pharmacies...');
  const vendorGrocery = await prisma.vendor.upsert({
    where: { slug: 'town-fresh-organics' },
    update: { name: 'Town Fresh Organics', ownerUserId: vendorAdminGrocery.id },
    create: {
      name: 'Town Fresh Organics',
      slug: 'town-fresh-organics',
      description: 'Direct farm-to-table organic produce and daily essentials vendor',
      ownerUserId: vendorAdminGrocery.id,
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop',
    },
  });

  const vendorDaily = await prisma.vendor.upsert({
    where: { slug: 'daily-pantry-express' },
    update: { name: 'Daily Pantry Express', ownerUserId: vendorAdminDaily.id },
    create: {
      name: 'Daily Pantry Express',
      slug: 'daily-pantry-express',
      description: 'Ultra-fast neighborhood grocery and household store',
      ownerUserId: vendorAdminDaily.id,
      logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop',
    },
  });

  const vendorPharma = await prisma.vendor.upsert({
    where: { slug: 'town-health-care' },
    update: { name: 'Town Health Care', ownerUserId: pharmacyAdmin.id },
    create: {
      name: 'Town Health Care',
      slug: 'town-health-care',
      description: 'Licensed pharmaceutical & medical devices provider',
      ownerUserId: pharmacyAdmin.id,
      logoUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200&auto=format&fit=crop',
    },
  });

  const storeFreshMart = await prisma.store.upsert({
    where: { slug: 'town-fresh-mart' },
    update: { name: 'Town Fresh Mart', addressId: store1Address.id },
    create: {
      vendorId: vendorGrocery.id,
      name: 'Town Fresh Mart',
      slug: 'town-fresh-mart',
      isGrocery: true,
      phone: '+919800011122',
      addressId: store1Address.id,
      deliveryArea: '7 km radius',
      estimatedDeliveryTime: '15-25 mins',
      minimumOrder: 99.0,
      deliveryFee: 25.0,
    },
  });

  await prisma.store.upsert({
    where: { slug: 'daily-pantry-sector-4' },
    update: { name: 'Daily Pantry Express Sector 4', addressId: store2Address.id },
    create: {
      vendorId: vendorDaily.id,
      name: 'Daily Pantry Express Sector 4',
      slug: 'daily-pantry-sector-4',
      isGrocery: true,
      phone: '+919800011133',
      addressId: store2Address.id,
      deliveryArea: '5 km radius',
      estimatedDeliveryTime: '10-20 mins',
      minimumOrder: 49.0,
      deliveryFee: 20.0,
    },
  });

  const pharmacyTownCare = await prisma.pharmacy.upsert({
    where: { slug: 'town-care-pharmacy' },
    update: { name: 'Town Care Pharmacy', addressId: pharmacy1Address.id },
    create: {
      vendorId: vendorPharma.id,
      name: 'Town Care Pharmacy',
      slug: 'town-care-pharmacy',
      licenseNumber: 'PHARM-2026-99',
      phone: '+919800022233',
      addressId: pharmacy1Address.id,
    },
  });

  // Category Tree
  console.log('🏷️ Seeding comprehensive category taxonomy...');
  interface CategoryDef {
    name: string;
    slug: string;
    description: string;
    isMedicine: boolean;
    displayOrder: number;
    subcategories?: Array<{ name: string; slug: string; description: string }>;
  }

  const categoryTree: CategoryDef[] = [
    // Grocery Taxonomy
    {
      name: 'Staples & Grains',
      slug: 'staples-grains',
      description: 'Chakki fresh atta, premium basmati rice, lentils, cooking oils, and traditional spices',
      isMedicine: false,
      displayOrder: 1,
      subcategories: [
        { name: 'Atta & Flour', slug: 'atta-flour', description: 'Whole wheat chakki fresh atta, maida, suji, and besan' },
        { name: 'Rice & Grains', slug: 'rice-grains', description: 'Long grain basmati rice, sona masoori, poha, and millets' },
        { name: 'Pulses & Dals', slug: 'pulses-dals', description: 'Unpolished toor dal, moong dal, chana dal, and rajma' },
        { name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', description: 'Sunflower oil, mustard oil, cow ghee, and olive oil' },
        { name: 'Spices & Masalas', slug: 'spices-masalas', description: 'Turmeric powder, red chilli, garam masala, and whole spices' },
        { name: 'Salt, Sugar & Jaggery', slug: 'salt-sugar-jaggery', description: 'Iodized salt, pure white sugar, brown sugar, and organic jaggery' },
      ],
    },
    {
      name: 'Snacks & Munchies',
      slug: 'snacks-munchies',
      description: 'Crispy namkeen, gourmet biscuits, dry fruits, chocolates, and evening snacks',
      isMedicine: false,
      displayOrder: 2,
      subcategories: [
        { name: 'Biscuits & Cookies', slug: 'biscuits-cookies', description: 'Butter cookies, cream biscuits, digestive biscuits, and rusk' },
        { name: 'Namkeen & Chips', slug: 'namkeen-chips', description: 'Bhujia, potato chips, roasted chana, and kurkure' },
        { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', description: 'California almonds, cashews, raisins, walnuts, and pistachios' },
        { name: 'Chocolates & Sweets', slug: 'chocolates-sweets', description: 'Milk chocolates, dark chocolates, traditional sweets, and candies' },
      ],
    },
    {
      name: 'Dairy & Breakfast',
      slug: 'dairy-breakfast',
      description: 'Fresh milk, artisanal paneer, butter, bakery breads, and healthy cereals',
      isMedicine: false,
      displayOrder: 3,
      subcategories: [
        { name: 'Milk & Dairy Products', slug: 'milk-dairy', description: 'Fresh milk, curd, malai paneer, butter, and cheese slices' },
        { name: 'Bread & Bakery', slug: 'bread-bakery', description: '100% whole wheat bread, sandwich bread, fruit cakes, and pav' },
        { name: 'Breakfast Cereals & Oats', slug: 'breakfast-cereals', description: 'Corn flakes, rolled oats, masala oats, and muesli' },
      ],
    },
    {
      name: 'Beverages & Packaged Foods',
      slug: 'beverages-packaged-foods',
      description: 'Refreshment teas, instant coffee, fruit juices, noodles, and gourmet spreads',
      isMedicine: false,
      displayOrder: 4,
      subcategories: [
        { name: 'Tea & Coffee', slug: 'tea-coffee', description: 'Assam black tea, green tea, instant coffee, and filter coffee' },
        { name: 'Juices & Soft Drinks', slug: 'juices-soft-drinks', description: '100% real fruit juices, cola soft drinks, and energy drinks' },
        { name: 'Instant Noodles & Pasta', slug: 'instant-noodles-pasta', description: '2-minute masala noodles, pasta, and ready-to-eat meals' },
        { name: 'Sauces, Spreads & Jams', slug: 'sauces-spreads', description: 'Tomato ketchup, hazelnut spread, peanut butter, and fruit jam' },
      ],
    },
    {
      name: 'Household & Personal Care',
      slug: 'household-personal-care',
      description: 'Laundry detergents, surface cleaners, bathing soaps, shampoos, and oral hygiene',
      isMedicine: false,
      displayOrder: 5,
      subcategories: [
        { name: 'Laundry & Dishwashing', slug: 'laundry-dishwashing', description: 'Detergent powders, liquid detergents, and dishwashing gels' },
        { name: 'Cleaning Essentials', slug: 'cleaning-essentials', description: 'Floor cleaners, toilet cleaners, and glass sprays' },
        { name: 'Soaps & Body Wash', slug: 'soaps-bodywash', description: 'Bathing bars, moisturizing soaps, and body wash gels' },
        { name: 'Hair Care & Shampoos', slug: 'haircare-shampoos', description: 'Anti-dandruff shampoos, hair oils, and conditioners' },
        { name: 'Dental & Oral Care', slug: 'dental-oral-care', description: 'Fluoride toothpaste, herbal toothpaste, and toothbrushes' },
      ],
    },

    // Strict Specific Medical & Pharmacy Taxonomy
    {
      name: 'Medical Devices & Diagnostics',
      slug: 'medical-devices',
      description: 'Verified digital thermometers, arm blood pressure monitors, fingertip pulse oximeters, and glucose meters',
      isMedicine: true,
      displayOrder: 6,
      subcategories: [
        { name: 'Digital Thermometers', slug: 'digital-thermometers', description: 'Clinical digital body thermometers with flexible tips and LCD fever display' },
        { name: 'Blood Pressure Monitors', slug: 'blood-pressure-monitors', description: 'Automatic upper arm digital blood pressure monitors with WHO indicator cuff' },
        { name: 'Pulse Oximeters', slug: 'pulse-oximeters', description: 'Fingertip SpO2 blood oxygen saturation monitors' },
        { name: 'Glucometers & Test Strips', slug: 'glucometers-strips', description: 'Blood glucose testing meters, lancets, and test strips' },
      ],
    },
    {
      name: 'OTC & General Medicines',
      slug: 'otc-medicines',
      description: 'Over-the-counter pain relief, fever tablets, cough syrups, and digestive antacids',
      isMedicine: true,
      displayOrder: 7,
      subcategories: [
        { name: 'Pain & Fever Relief', slug: 'pain-fever-relief', description: 'Analgesics, fever reducers, muscular pain sprays, and ointments' },
        { name: 'Cough, Cold & Throat', slug: 'cough-cold-throat', description: 'Chest congestion syrups, herbal throat lozenges, and sinus relief' },
        { name: 'Antacids & Digestive Health', slug: 'antacids-digestive-health', description: 'Fast-acting antacid effervescent powders and digestive mint gels' },
        { name: 'Multivitamins & Supplements', slug: 'multivitamins-supplements', description: 'Daily health capsules, calcium + D3, and immunity boosters' },
      ],
    },
    {
      name: 'First Aid & Healthcare',
      slug: 'first-aid-healthcare',
      description: 'Antiseptic disinfectant liquids, medicated band-aids, wound dressings, and medical mouthwashes',
      isMedicine: true,
      displayOrder: 8,
      subcategories: [
        { name: 'Antiseptics & Bandages', slug: 'antiseptics-bandages', description: 'Chloroxylenol liquid, waterproof bandages, and sterile cotton rolls' },
        { name: 'Oral Hygiene & Mouthwash', slug: 'oral-care-pharma', description: 'Antiseptic mouthwashes and sensitive tooth paste' },
      ],
    },
    {
      name: 'Prescription Care',
      slug: 'prescription-care',
      description: 'Verified prescription medications requiring a registered doctor prescription upload prior to dispatch',
      isMedicine: true,
      displayOrder: 9,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoryTree) {
    const parentRecord = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isMedicine: cat.isMedicine, displayOrder: cat.displayOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, isMedicine: cat.isMedicine, displayOrder: cat.displayOrder },
    });
    categoryMap.set(cat.slug, parentRecord.id);

    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        const subRecord = await prisma.category.upsert({
          where: { slug: sub.slug },
          update: { name: sub.name, description: sub.description, parentId: parentRecord.id, isMedicine: cat.isMedicine },
          create: { name: sub.name, slug: sub.slug, description: sub.description, parentId: parentRecord.id, isMedicine: cat.isMedicine },
        });
        categoryMap.set(sub.slug, subRecord.id);
      }
    }
  }

  // Clear existing catalog data
  console.log('🧹 Clearing legacy product catalog data...');
  await prisma.productImage.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('🛒 Seeding Grocery Catalog Products...');
  const groceryItemsSeedData = [
    // Atta & Flour
    { brand: 'Aashirvaad', name: 'Superior MP Whole Wheat Atta 5kg', mrp: 275, price: 245, unit: '5 kg', cat: 'atta-flour', featured: true, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop' },
    { brand: 'Fortune', name: 'Chakki Fresh Atta 5kg', mrp: 260, price: 229, unit: '5 kg', cat: 'atta-flour', featured: false, img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop' },
    { brand: 'Pillsbury', name: 'Chakki Fresh Whole Wheat Atta 5kg', mrp: 265, price: 235, unit: '5 kg', cat: 'atta-flour', featured: false, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop' },
    { brand: 'Rajdhani', name: 'Sooji Semolina Granulated 500g', mrp: 38, price: 32, unit: '500 g', cat: 'atta-flour', featured: false, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop' },
    { brand: 'Tata Sampann', name: 'Fine Unpolished Besan Gram Flour 500g', mrp: 75, price: 64, unit: '500 g', cat: 'atta-flour', featured: true, img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=600&auto=format&fit=crop' },

    // Rice & Grains
    { brand: 'Daawat', name: 'Rozana Super Basmati Rice 5kg', mrp: 485, price: 399, unit: '5 kg', cat: 'rice-grains', featured: true, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop' },
    { brand: 'India Gate', name: 'Feast Rozana Basmati Rice 5kg', mrp: 520, price: 449, unit: '5 kg', cat: 'rice-grains', featured: true, img: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop' },
    { brand: 'Fortune', name: 'Everyday Basmati Rice 1kg', mrp: 110, price: 88, unit: '1 kg', cat: 'rice-grains', featured: false, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop' },

    // Pulses & Dals
    { brand: 'Tata Sampann', name: 'Unpolished Toor Dal 1kg', mrp: 185, price: 159, unit: '1 kg', cat: 'pulses-dals', featured: true, img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=600&auto=format&fit=crop' },
    { brand: 'Tata Sampann', name: 'Unpolished Moong Dal Split 500g', mrp: 95, price: 79, unit: '500 g', cat: 'pulses-dals', featured: false, img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=600&auto=format&fit=crop' },

    // Edible Oils & Ghee
    { brand: 'Fortune', name: 'Sunlite Refined Sunflower Oil 1L', mrp: 155, price: 132, unit: '1 L', cat: 'edible-oils-ghee', featured: true, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop' },
    { brand: 'Fortune', name: 'Kachi Ghani Pure Mustard Oil 1L', mrp: 175, price: 149, unit: '1 L', cat: 'edible-oils-ghee', featured: true, img: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&auto=format&fit=crop' },
    { brand: 'Amul', name: 'Pure Cow Desi Ghee 1L Tin', mrp: 650, price: 595, unit: '1 L', cat: 'edible-oils-ghee', featured: true, img: 'https://images.unsplash.com/photo-1589927986076-a58133819602?w=600&auto=format&fit=crop' },

    // Spices & Masalas
    { brand: 'Everest', name: 'Turmeric Powder (Haldi) 200g', mrp: 62, price: 52, unit: '200 g', cat: 'spices-masalas', featured: true, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop' },
    { brand: 'MDH', name: 'Tikhalal Red Chilli Powder 100g', mrp: 54, price: 46, unit: '100 g', cat: 'spices-masalas', featured: false, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop' },

    // Biscuits & Namkeen
    { brand: 'Parle', name: 'Parle-G Gold Glucose Biscuits 1kg Pack', mrp: 140, price: 120, unit: '1 kg', cat: 'biscuits-cookies', featured: true, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop' },
    { brand: "Haldiram's", name: 'Bikaneri Bhujia Crisp Sev 400g', mrp: 135, price: 115, unit: '400 g', cat: 'namkeen-chips', featured: true, img: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?w=600&auto=format&fit=crop' },
    { brand: "Lay's", name: "India's Magic Masala Potato Chips 50g", mrp: 20, price: 18, unit: '50 g', cat: 'namkeen-chips', featured: true, img: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?w=600&auto=format&fit=crop' },

    // Dairy & Beverages
    { brand: 'Amul', name: 'Taaza Homogenised Toned Milk 1L', mrp: 74, price: 70, unit: '1 L', cat: 'milk-dairy', featured: true, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop' },
    { brand: 'Tata Tea', name: 'Gold Premium Assam Tea 500g', mrp: 345, price: 289, unit: '500 g', cat: 'tea-coffee', featured: true, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop' },
    { brand: 'Tropicana', name: '100% Real Orange Juice 1L', mrp: 160, price: 135, unit: '1 L', cat: 'juices-soft-drinks', featured: true, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop' },

    // Cleaning & Personal Care
    { brand: 'Surf Excel', name: 'Easy Wash Detergent Powder 1kg', mrp: 150, price: 132, unit: '1 kg', cat: 'laundry-dishwashing', featured: true, img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop' },
    { brand: 'Colgate', name: 'Total Whole Mouth Health Toothpaste 150g', mrp: 145, price: 122, unit: '150 g', cat: 'dental-oral-care', featured: true, img: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&auto=format&fit=crop' },
  ];

  let itemIdx = 0;
  for (const g of groceryItemsSeedData) {
    itemIdx++;
    const sku = `GR-ACC-${String(itemIdx).padStart(3, '0')}`;
    const slug = `${g.brand.toLowerCase()}-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const categoryId = categoryMap.get(g.cat) || categoryMap.get('staples-grains')!;

    const p = await prisma.product.create({
      data: {
        sku,
        name: `${g.brand} ${g.name}`,
        slug,
        description: `Authentic ${g.name} by ${g.brand}. Sourced fresh and delivered quickly to your doorstep.`,
        brand: g.brand,
        unit: g.unit,
        price: g.price,
        compareAtPrice: g.mrp,
        taxRate: 5.0,
        isFeatured: g.featured,
        categoryId,
        vendorId: vendorGrocery.id,
        storeId: storeFreshMart.id,
        isMedicine: false,
        isPrescriptionRequired: false,
        isActive: true,
        metadata: { tags: [g.brand.toLowerCase(), g.cat, 'grocery'] },
      },
    });

    await prisma.productImage.create({
      data: {
        productId: p.id,
        url: g.img,
        key: `img-${sku}-primary`,
        altText: `${g.brand} ${g.name}`,
        isPrimary: true,
        displayOrder: 1,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        productId: p.id,
        storeId: storeFreshMart.id,
        quantity: 50 + (itemIdx * 3) % 100,
        minThreshold: 5,
      },
    });
  }

  console.log('💊 Seeding Verified Medical Devices & Pharmacy Catalog Products...');

  // 23 AUTHENTIC MEDICAL PRODUCTS - EVERY SINGLE ONE HAS A 100% UNIQUE IMAGE URL
  const authenticMedicalCatalog = [
    // --- 1. DIGITAL THERMOMETERS ---
    {
      sku: 'PH-DEV-001',
      name: 'Dr Trust Waterproof Digital Flexible Tip Thermometer (Model 211)',
      slug: 'dr-trust-waterproof-digital-flexible-tip-thermometer-211',
      description: 'Clinical digital body thermometer featuring a flexible soft rubber tip, 10-second fast sensor reading, dual °C/°F mode, and fever warning beep.',
      brand: 'Dr Trust',
      cat: 'digital-thermometers',
      mrp: 350,
      price: 249,
      unit: '1 Unit',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Digital Body Thermometer',
        modelNumber: 'Model 211',
        manufacturer: 'Nureca Inc',
        displayType: 'LCD Screen',
        powerSource: 'Battery Powered (CR2032)',
        storageInstructions: 'Store in protective case away from extreme heat.',
        imageSourceUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-DEV-002',
      name: 'Omron Flex Temp Smart Digital Medical Thermometer (MC-246)',
      slug: 'omron-flex-temp-smart-digital-thermometer-mc246',
      description: 'Water-resistant digital oral and axillary thermometer with 60-second measurement, memory recall, and automatic shutoff.',
      brand: 'Omron',
      cat: 'digital-thermometers',
      mrp: 390,
      price: 295,
      unit: '1 Unit',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Digital Body Thermometer',
        modelNumber: 'MC-246',
        manufacturer: 'Omron Healthcare Co. Ltd',
        displayType: '3-digit LCD',
        storageInstructions: 'Clean probe with alcohol wipe after each use.',
        imageSourceUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-DEV-003',
      name: 'Hicks DT-101 Digital Body Thermometer',
      slug: 'hicks-dt101-digital-body-thermometer',
      description: 'High accuracy clinical digital thermometer with clear digital display screen and automatic beep indicator.',
      brand: 'Hicks',
      cat: 'digital-thermometers',
      mrp: 220,
      price: 175,
      unit: '1 Unit',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Digital Body Thermometer',
        modelNumber: 'DT-101',
        manufacturer: 'Hicks India Ltd',
        imageSourceUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 2. BLOOD PRESSURE MONITORS ---
    {
      sku: 'PH-DEV-004',
      name: 'Omron HEM-7120 Fully Automatic Digital Blood Pressure Monitor',
      slug: 'omron-hem7120-automatic-digital-blood-pressure-monitor',
      description: 'Upper arm digital BP monitor equipped with Intellisense Technology, arm cuff (22-32 cm), irregular heartbeat detector, and WHO hypertension indicator.',
      brand: 'Omron',
      cat: 'blood-pressure-monitors',
      mrp: 2480,
      price: 1899,
      unit: '1 Device with Cuff',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Automatic Arm BP Monitor',
        modelNumber: 'HEM-7120',
        manufacturer: 'Omron Healthcare Co. Ltd',
        cuffSize: 'Medium (22 - 32 cm)',
        powerSource: '4 AA Batteries or AC Adapter',
        warranty: '3 Years Manufacturer Warranty',
        imageSourceUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-DEV-005',
      name: 'Dr Trust Smart Executive Upper Arm BP Monitor 101',
      slug: 'dr-trust-smart-executive-upper-arm-bp-monitor-101',
      description: 'Fully automatic digital blood pressure monitor with large LCD backlit screen, dual-user 120 reading memory, and micro-USB port.',
      brand: 'Dr Trust',
      cat: 'blood-pressure-monitors',
      mrp: 2200,
      price: 1650,
      unit: '1 Device Unit',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Digital BP Monitor',
        modelNumber: 'Model 101',
        manufacturer: 'Nureca Inc',
        displayType: 'LCD Backlit',
        imageSourceUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-DEV-006',
      name: 'Dr Morepen BBP-02 Automatic Blood Pressure Monitor',
      slug: 'dr-morepen-bbp02-automatic-blood-pressure-monitor',
      description: 'Upper arm digital blood pressure monitor with WHO indicator, 4-user memory function, and low battery alert.',
      brand: 'Dr Morepen',
      cat: 'blood-pressure-monitors',
      mrp: 1990,
      price: 1399,
      unit: '1 Device Unit',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Digital BP Monitor',
        modelNumber: 'BBP-02',
        manufacturer: 'Morepen Laboratories Ltd',
        imageSourceUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 3. PULSE OXIMETERS ---
    {
      sku: 'PH-DEV-007',
      name: 'Dr Trust Fingertip Pulse Oximeter 210',
      slug: 'dr-trust-fingertip-pulse-oximeter-210',
      description: 'Non-invasive pulse oximeter for measuring arterial blood oxygen saturation (SpO2) and pulse rate (PR) with dual-color OLED display.',
      brand: 'Dr Trust',
      cat: 'pulse-oximeters',
      mrp: 1499,
      price: 999,
      unit: '1 Unit',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Fingertip Pulse Oximeter',
        modelNumber: 'Model 210',
        manufacturer: 'Nureca Inc',
        displayType: 'OLED Display',
        imageSourceUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 4. GLUCOMETERS & STRIPS ---
    {
      sku: 'PH-DEV-008',
      name: 'Accu-Chek Active Blood Glucose Meter System Kit',
      slug: 'accu-chek-active-blood-glucose-meter-kit',
      description: 'Fast 5-second blood sugar monitoring kit with 500-test memory, 10 free active test strips, and lancing device.',
      brand: 'Accu-Chek',
      cat: 'glucometers-strips',
      mrp: 1599,
      price: 1249,
      unit: '1 Kit (Meter + 10 Strips)',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Blood Glucose Monitor Kit',
        manufacturer: 'Roche Diabetes Care',
        sampleVolume: '1-2 µL blood',
        imageSourceUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-DEV-009',
      name: 'OneTouch Verio Flex Blood Glucose Monitor',
      slug: 'onetouch-verio-flex-blood-glucose-monitor',
      description: 'ColorSure technology instantly shows high/low sugar results with wireless Bluetooth mobile app sync.',
      brand: 'OneTouch',
      cat: 'glucometers-strips',
      mrp: 1350,
      price: 1049,
      unit: '1 Kit',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1615461065929-4f8ffed6ca40?w=600&auto=format&fit=crop',
      meta: {
        deviceType: 'Blood Glucose Meter',
        manufacturer: 'Lifescan Ltd',
        imageSourceUrl: 'https://images.unsplash.com/photo-1615461065929-4f8ffed6ca40',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 5. ANTISEPTICS & BANDAGES ---
    {
      sku: 'PH-CARE-010',
      name: 'Dettol Antiseptic Liquid Disinfectant 550ml',
      slug: 'dettol-antiseptic-liquid-disinfectant-550ml',
      description: 'Chloroxylenol antiseptic disinfectant liquid for first aid wound cleaning, personal hygiene, and laundry sterilization.',
      brand: 'Dettol',
      cat: 'antiseptics-bandages',
      mrp: 235,
      price: 199,
      unit: '550 ml bottle',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Chloroxylenol IP 4.8% w/v',
        manufacturer: 'Reckitt Benckiser India',
        dosageForm: 'Antiseptic Solution',
        imageSourceUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-CARE-011',
      name: 'Hansaplast Waterproof Medicated Bandages (Pack of 20)',
      slug: 'hansaplast-waterproof-medicated-bandages-20s',
      description: 'Strong adhesion waterproof plaster bandages with antiseptic non-stick central pad for cuts and grazes.',
      brand: 'Hansaplast',
      cat: 'antiseptics-bandages',
      mrp: 70,
      price: 60,
      unit: '20 Strips',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Medicated Wound Dressing Strip',
        manufacturer: 'Beiersdorf India Ltd',
        dosageForm: 'Plaster Strip',
        imageSourceUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 6. PAIN & FEVER OTC MEDICINES ---
    {
      sku: 'PH-MED-012',
      name: 'Dolo 650mg Paracetamol Tablets (Strip of 15)',
      slug: 'dolo-650mg-paracetamol-tablets-15s',
      description: 'Analgesic and antipyretic tablets indicated for symptomatic fever reduction, headache, toothache, and body ache.',
      brand: 'Dolo',
      cat: 'pain-fever-relief',
      mrp: 34,
      price: 30,
      unit: '15 Tablets',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1550572017-edf986348986?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Paracetamol IP 650 mg',
        composition: 'Paracetamol IP 650 mg',
        manufacturer: 'Micro Labs Ltd',
        dosageForm: 'Tablet',
        storageInstructions: 'Store below 30°C away from heat and moisture.',
        warningDisclaimer: 'Do not exceed 4 tablets in 24 hours. Prolonged use may cause liver toxicity.',
        imageSourceUrl: 'https://images.unsplash.com/photo-1550572017-edf986348986',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-013',
      name: 'Crocin 650mg Pain Relief Tablets (Strip of 15)',
      slug: 'crocin-pain-relief-650mg-tablets-15s',
      description: 'Fast-acting Paracetamol formulation enriched with Caffeine for fast headache, fever, and muscle discomfort relief.',
      brand: 'Crocin',
      cat: 'pain-fever-relief',
      mrp: 65,
      price: 56,
      unit: '15 Tablets',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Paracetamol + Caffeine',
        composition: 'Paracetamol 650 mg + Caffeine 50 mg',
        manufacturer: 'GSK Consumer Healthcare',
        dosageForm: 'Tablet',
        imageSourceUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-014',
      name: 'Combiflam Pain Relief Tablets (Strip of 20)',
      slug: 'combiflam-pain-relief-tablets-20s',
      description: 'Dual action Ibuprofen and Paracetamol combination for fast joint, toothache, and inflammation relief.',
      brand: 'Combiflam',
      cat: 'pain-fever-relief',
      mrp: 48,
      price: 41,
      unit: '20 Tablets',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Ibuprofen + Paracetamol',
        composition: 'Ibuprofen IP 400 mg + Paracetamol IP 325 mg',
        manufacturer: 'Sanofi India Ltd',
        dosageForm: 'Tablet',
        imageSourceUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-015',
      name: 'Volini Fast Pain Relief Spray 40g',
      slug: 'volini-fast-pain-relief-spray-40g',
      description: 'Aerosol spray formulated with Diclofenac Diethylamine and Menthol for deep, fast relief from back pain, joint stiffness, and sprains.',
      brand: 'Volini',
      cat: 'pain-fever-relief',
      mrp: 160,
      price: 139,
      unit: '40 g spray',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Diclofenac + Menthol Topical Spray',
        manufacturer: 'Sun Pharmaceutical Industries',
        dosageForm: 'Topical Spray',
        imageSourceUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-016',
      name: 'Moov Pain Relief Ointment 50g',
      slug: 'moov-pain-relief-ointment-50g',
      description: 'Ayurvedic topical pain ointment with wintergreen oil for soothing backache and joint pain.',
      brand: 'Moov',
      cat: 'pain-fever-relief',
      mrp: 195,
      price: 168,
      unit: '50 g tube',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Ayurvedic Pain Balm',
        manufacturer: 'Reckitt Benckiser India',
        dosageForm: 'Ointment',
        imageSourceUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 7. COUGH & THROAT OTC MEDICINES ---
    {
      sku: 'PH-MED-017',
      name: 'Benadryl Cough Syrup 150ml Bottle',
      slug: 'benadryl-cough-syrup-150ml',
      description: 'Oral syrup for relieving chest congestion, throat tickle, and dry cough with soothing antihistaminic action.',
      brand: 'Benadryl',
      cat: 'cough-cold-throat',
      mrp: 145,
      price: 125,
      unit: '150 ml bottle',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Diphenhydramine HCl + Ammonium Chloride',
        manufacturer: 'Johnson & Johnson Ltd',
        dosageForm: 'Syrup',
        imageSourceUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 8. ANTACIDS & DIGESTIVE ---
    {
      sku: 'PH-MED-018',
      name: 'Eno Fast Relief Orange Antacid Powder (Pack of 6 Sachets)',
      slug: 'eno-orange-fast-relief-antacid-sachets-6s',
      description: 'Effervescent antacid sachets that work in 6 seconds to neutralize hyperacidity, stomach fullness, and heartburn.',
      brand: 'Eno',
      cat: 'antacids-digestive-health',
      mrp: 60,
      price: 52,
      unit: '6 Sachets',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1563172897-936284310ddc?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Svarjiksara + Nimbukamlam',
        manufacturer: 'GlaxoSmithKline',
        dosageForm: 'Effervescent Powder',
        imageSourceUrl: 'https://images.unsplash.com/photo-1563172897-936284310ddc',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 9. MULTIVITAMINS & SUPPLEMENTS ---
    {
      sku: 'PH-MED-019',
      name: 'Revital H Daily Health Supplement Capsules (Pack of 30)',
      slug: 'revital-h-daily-health-capsules-30s',
      description: 'Nutritional health capsule containing Ginseng extract, 10 Vitamins, and 9 Minerals to support physical stamina and mental alertness.',
      brand: 'Revital H',
      cat: 'multivitamins-supplements',
      mrp: 335,
      price: 285,
      unit: '30 Capsules',
      rx: false,
      featured: true,
      img: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Ginseng + Multivitamins & Minerals',
        manufacturer: 'Sun Pharmaceutical Industries',
        dosageForm: 'Capsule',
        imageSourceUrl: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-020',
      name: 'Shelcal 500mg Calcium & Vitamin D3 Tablets (Strip of 15)',
      slug: 'shelcal-500mg-calcium-vitamin-d3-15s',
      description: 'High absorption elemental calcium with Vitamin D3 for bone strength and joint mobility.',
      brand: 'Shelcal',
      cat: 'multivitamins-supplements',
      mrp: 130,
      price: 110,
      unit: '15 Tablets',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Calcium Carbonate + Vitamin D3',
        manufacturer: 'Torrent Pharmaceuticals',
        dosageForm: 'Tablet',
        imageSourceUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-MED-021',
      name: 'Becosules Z Vitamin B-Complex & Zinc Capsules (Strip of 20)',
      slug: 'becosules-z-vitamin-bcomplex-capsules-20s',
      description: 'Therapeutic vitamin B-complex capsules enriched with Vitamin C and Zinc for tissue repair and energy recovery.',
      brand: 'Becosules',
      cat: 'multivitamins-supplements',
      mrp: 52,
      price: 44,
      unit: '20 Capsules',
      rx: false,
      featured: false,
      img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Vitamin B Complex + Vitamin C + Zinc',
        manufacturer: 'Pfizer Ltd',
        dosageForm: 'Capsule',
        imageSourceUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462',
        imageVerifiedAt: '2026-09-27',
      },
    },

    // --- 10. PRESCRIPTION CARE (Rx Required) ---
    {
      sku: 'PH-RX-022',
      name: 'Cipla Amoxicillin 500mg Antibiotic Capsules (Strip of 10) - Rx Required',
      slug: 'amoxicillin-500mg-capsules-10s',
      description: 'Broad-spectrum penicillin antibiotic capsules for treating verified bacterial respiratory and dental infections under doctor supervision.',
      brand: 'Cipla',
      cat: 'prescription-care',
      mrp: 110,
      price: 94,
      unit: '10 Capsules',
      rx: true,
      featured: true,
      img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Amoxicillin Trihydrate 500 mg',
        composition: 'Amoxicillin Trihydrate IP equivalent to Amoxicillin 500 mg',
        manufacturer: 'Cipla Ltd',
        dosageForm: 'Capsule',
        warningDisclaimer: 'CAUTION: Schedule H Prescription Drug. To be dispensed on valid medical prescription only.',
        imageSourceUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926',
        imageVerifiedAt: '2026-09-27',
      },
    },
    {
      sku: 'PH-RX-023',
      name: 'Pantop 40mg Gastro-Resistant Tablets (Strip of 15) - Rx Required',
      slug: 'pantop-40mg-tablets-15s',
      description: 'Proton pump inhibitor (PPI) that reduces excess acid produced in stomach, treating acid reflux and GERD.',
      brand: 'Pantop',
      cat: 'prescription-care',
      mrp: 155,
      price: 132,
      unit: '15 Tablets',
      rx: true,
      featured: false,
      img: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop',
      meta: {
        genericName: 'Pantoprazole Sodium 40mg',
        composition: 'Pantoprazole Sodium Gastro-resistant IP 40 mg',
        manufacturer: 'Aristo Pharmaceuticals Ltd',
        dosageForm: 'Tablet',
        warningDisclaimer: 'CAUTION: Schedule H Drug. Take under medical prescription only.',
        imageSourceUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831',
        imageVerifiedAt: '2026-09-27',
      },
    },
  ];

  let pCount = 0;
  for (const m of authenticMedicalCatalog) {
    pCount++;
    const categoryId = categoryMap.get(m.cat) || categoryMap.get('digital-thermometers')!;

    const pRecord = await prisma.product.create({
      data: {
        sku: m.sku,
        name: m.name,
        slug: m.slug,
        description: m.description,
        brand: m.brand,
        unit: m.unit,
        price: m.price,
        compareAtPrice: m.mrp,
        taxRate: 12.0,
        isFeatured: m.featured,
        categoryId,
        vendorId: vendorPharma.id,
        pharmacyId: pharmacyTownCare.id,
        isMedicine: true,
        isPrescriptionRequired: m.rx,
        isActive: true,
        metadata: {
          ...m.meta,
          demoBatchNumber: `BT-2026-${2000 + pCount}`,
          demoExpiryDate: '2028-12-31',
          tags: [m.brand.toLowerCase(), m.cat, 'pharmacy'],
        },
      },
    });

    await prisma.productImage.create({
      data: {
        productId: pRecord.id,
        url: m.img,
        key: `img-${m.sku}-primary`,
        altText: `${m.name} Packaging View`,
        isPrimary: true,
        displayOrder: 1,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        productId: pRecord.id,
        pharmacyId: pharmacyTownCare.id,
        quantity: 40 + (pCount * 7) % 60,
        minThreshold: 5,
      },
    });
  }

  console.log('🎉 Seed Execution Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

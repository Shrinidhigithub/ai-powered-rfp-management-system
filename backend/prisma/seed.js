const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { email: 'sales@techsupply.com' },
      update: {},
      create: {
        name: 'TechSupply Co.',
        email: 'sales@techsupply.com',
        contactPerson: 'John Smith',
        phone: '+1-555-0101',
        address: '123 Tech Street, Silicon Valley, CA 94000',
      },
    }),
    prisma.vendor.upsert({
      where: { email: 'quotes@officeworld.com' },
      update: {},
      create: {
        name: 'OfficeWorld Inc.',
        email: 'quotes@officeworld.com',
        contactPerson: 'Sarah Johnson',
        phone: '+1-555-0102',
        address: '456 Office Park, New York, NY 10001',
      },
    }),
    prisma.vendor.upsert({
      where: { email: 'enterprise@globalhardware.com' },
      update: {},
      create: {
        name: 'Global Hardware Solutions',
        email: 'enterprise@globalhardware.com',
        contactPerson: 'Mike Chen',
        phone: '+1-555-0103',
        address: '789 Industrial Ave, Austin, TX 78701',
      },
    }),
  ]);

  console.log(`✅ Created ${vendors.length} vendors`);
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

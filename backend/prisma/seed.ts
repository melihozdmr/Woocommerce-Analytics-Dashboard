import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Plans
  const plans = [
    {
      name: PlanType.FREE,
      displayName: 'Free',
      storeLimit: 2,
      refreshInterval: 15,
      historyDays: 30,
      priceMonthly: 0,
      priceYearly: 0,
      features: {
        csvExport: false,
        pdfExport: false,
        emailReports: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
    {
      name: PlanType.PRO,
      displayName: 'Pro',
      storeLimit: 5,
      refreshInterval: 5,
      historyDays: 365,
      priceMonthly: 99,
      priceYearly: 990,
      features: {
        csvExport: true,
        pdfExport: true,
        emailReports: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
    {
      name: PlanType.ENTERPRISE,
      displayName: 'Enterprise',
      storeLimit: 10,
      refreshInterval: 1,
      historyDays: 730,
      priceMonthly: 299,
      priceYearly: 2990,
      features: {
        csvExport: true,
        pdfExport: true,
        emailReports: true,
        apiAccess: true,
        prioritySupport: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`Created/Updated plan: ${plan.displayName}`);
  }

  // Create default settings
  const settings = [
    { key: 'pricing_enabled', value: 'false' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`Created/Updated setting: ${setting.key}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

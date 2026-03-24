import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı seed başlıyor...");

  // Admin kullanıcıları oluştur
  const admins = [
    {
      email: process.env.ADMIN_EMAIL_1 || "admin1@merttur.com",
      password: process.env.ADMIN_PASSWORD_1 || "MertTur2024!",
      name: process.env.ADMIN_NAME_1 || "Admin 1",
    },
    {
      email: process.env.ADMIN_EMAIL_2 || "admin2@merttur.com",
      password: process.env.ADMIN_PASSWORD_2 || "MertTur2024!",
      name: process.env.ADMIN_NAME_2 || "Admin 2",
    },
    {
      email: process.env.ADMIN_EMAIL_3 || "admin3@merttur.com",
      password: process.env.ADMIN_PASSWORD_3 || "MertTur2024!",
      name: process.env.ADMIN_NAME_3 || "Admin 3",
    },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: hashedPassword,
        name: admin.name,
        role: "admin",
      },
    });
    console.log(`✅ Kullanıcı oluşturuldu: ${admin.email}`);
  }

  // Örnek şöför
  await prisma.driver.upsert({
    where: { id: "example-driver-1" },
    update: {},
    create: {
      id: "example-driver-1",
      name: "Örnek Şöför",
      phone: "05001234567",
      status: "active",
      licenseClass: "D",
      srcExpiry: new Date("2027-06-15"),
      psychotechExpiry: new Date("2027-06-15"),
      criminalRecordDate: new Date("2026-01-10"),
      criminalRecordExpiry: new Date("2026-04-10"),
    },
  });

  // Örnek araç - fişten aldığımız plaka
  await prisma.vehicle.upsert({
    where: { plate: "45 J 9443" },
    update: {},
    create: {
      plate: "45 J 9443",
      brand: "Ford",
      model: "Transit",
      year: 2020,
      capacity: 14,
      color: "Sarı",
      status: "active",
      inspectionExpiry: new Date("2026-06-01"), // 6 ayda bir!
      insuranceExpiry: new Date("2026-12-01"),
      routePermitExpiry: new Date("2026-09-01"),
      approvalExpiry: new Date("2026-09-01"),
    },
  });

  // Ayarlar
  await prisma.setting.upsert({
    where: { key: "company_name" },
    update: {},
    create: { key: "company_name", value: "Mert Tur" },
  });
  await prisma.setting.upsert({
    where: { key: "company_phone" },
    update: {},
    create: { key: "company_phone", value: "0506 122 73 63" },
  });
  await prisma.setting.upsert({
    where: { key: "company_city" },
    update: {},
    create: { key: "company_city", value: "Gölmarmara / Manisa" },
  });

  console.log("✅ Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

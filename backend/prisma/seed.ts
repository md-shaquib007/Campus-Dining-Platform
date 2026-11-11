import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Super Admin
  const superAdminHash = await bcrypt.hash('SuperAdmin@123', 12);
  await prisma.user.upsert({
    where: { email: 'superadmin@cdip.io' },
    update: {},
    create: {
      email: 'superadmin@cdip.io',
      passwordHash: superAdminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  // Demo College
  const college = await prisma.college.upsert({
    where: { slug: 'demo-university' },
    update: {},
    create: {
      name: 'Demo University',
      slug: 'demo-university',
      address: '123 Campus Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      subscription: { create: { plan: 'PRO', status: 'ACTIVE', maxUsers: 2000, maxHostels: 10 } },
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // College Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.edu' },
    update: {},
    create: {
      email: 'admin@demo.edu',
      passwordHash,
      firstName: 'College',
      lastName: 'Admin',
      role: UserRole.COLLEGE_ADMIN,
      collegeId: college.id,
      isVerified: true,
      isActive: true,
    },
  });

  // Hostel
  const hostel = await prisma.hostel.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'BH-A' } },
    update: {},
    create: {
      collegeId: college.id,
      name: 'Boys Hostel A',
      code: 'BH-A',
      capacity: 500,
      blocks: {
        create: {
          name: 'Block 1',
          floors: {
            create: {
              number: 1,
              rooms: { create: [{ number: '101', capacity: 2 }, { number: '102', capacity: 2 }] },
            },
          },
        },
      },
    },
    include: { blocks: { include: { floors: { include: { rooms: true } } } } },
  });

  const room = hostel.blocks[0]?.floors[0]?.rooms[0];

  // Dining Hall
  const diningHall = await prisma.diningHall.upsert({
    where: { id: 'seed-dining-hall' },
    update: {},
    create: {
      id: 'seed-dining-hall',
      collegeId: college.id,
      hostelId: hostel.id,
      name: 'Main Dining Hall',
      capacity: 300,
      location: 'Ground Floor, Block 1',
      timings: {
        create: [
          { mealType: 'BREAKFAST', startTime: '07:00', endTime: '09:00' },
          { mealType: 'LUNCH', startTime: '12:00', endTime: '14:00' },
          { mealType: 'SNACKS', startTime: '16:00', endTime: '17:00' },
          { mealType: 'DINNER', startTime: '19:00', endTime: '21:00' },
        ],
      },
    },
  });

  // Warden
  const wardenHash = await bcrypt.hash('Warden@123', 12);
  await prisma.user.upsert({
    where: { email: 'warden@demo.edu' },
    update: {},
    create: {
      email: 'warden@demo.edu',
      passwordHash: wardenHash,
      firstName: 'Raj',
      lastName: 'Sharma',
      role: UserRole.WARDEN,
      collegeId: college.id,
      isVerified: true,
      isActive: true,
      warden: { create: { hostelId: hostel.id } },
    },
  });

  // Mess Operator
  const operatorHash = await bcrypt.hash('Operator@123', 12);
  const operator = await prisma.user.upsert({
    where: { email: 'operator@demo.edu' },
    update: {},
    create: {
      email: 'operator@demo.edu',
      passwordHash: operatorHash,
      firstName: 'Mess',
      lastName: 'Operator',
      role: UserRole.MESS_OPERATOR,
      collegeId: college.id,
      isVerified: true,
      isActive: true,
      contractor: {
        create: { collegeId: college.id, companyName: 'Fresh Foods Catering', rating: 4.2 },
      },
    },
    include: { contractor: true },
  });

  if (operator.contractor) {
    await prisma.diningHall.update({
      where: { id: diningHall.id },
      data: { contractorId: operator.contractor.id },
    });
  }

  // Student
  const studentHash = await bcrypt.hash('Student@123', 12);
  await prisma.user.upsert({
    where: { email: 'student@demo.edu' },
    update: {},
    create: {
      email: 'student@demo.edu',
      passwordHash: studentHash,
      firstName: 'Amit',
      lastName: 'Kumar',
      role: UserRole.STUDENT,
      collegeId: college.id,
      isVerified: true,
      isActive: true,
      student: {
        create: {
          hostelId: hostel.id,
          roomId: room?.id,
          rollNumber: 'CS2024001',
          department: 'Computer Science',
          year: 2,
          semester: 3,
        },
      },
    },
  });

  // Today's Menu
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingMenu = await prisma.menu.findUnique({
    where: { diningHallId_menuDate: { diningHallId: diningHall.id, menuDate: today } },
  });

  if (!existingMenu) {
    await prisma.menu.create({
      data: {
        diningHallId: diningHall.id,
        menuDate: today,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: admin.id,
        meals: {
          create: [
            {
              mealType: 'BREAKFAST',
              dishes: {
                create: [
                  { name: 'Poha', isVegetarian: true, calories: 250 },
                  { name: 'Tea', isVegetarian: true, calories: 50 },
                ],
              },
            },
            {
              mealType: 'LUNCH',
              dishes: {
                create: [
                  { name: 'Dal Rice', isVegetarian: true, calories: 450 },
                  { name: 'Roti', isVegetarian: true, calories: 120 },
                  { name: 'Mixed Veg', isVegetarian: true, calories: 180 },
                ],
              },
            },
            {
              mealType: 'SNACKS',
              dishes: { create: [{ name: 'Samosa', isVegetarian: true, calories: 200 }] },
            },
            {
              mealType: 'DINNER',
              dishes: {
                create: [
                  { name: 'Chicken Curry', isVegetarian: false, calories: 380 },
                  { name: 'Jeera Rice', isVegetarian: true, calories: 220 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // Sample Announcement
  await prisma.announcement.create({
    data: {
      collegeId: college.id,
      title: 'Welcome to CDIP!',
      content: 'Start rating your meals and help us improve dining quality.',
      type: 'GENERAL',
      isPinned: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  Super Admin: superadmin@cdip.io / SuperAdmin@123');
  console.log('  College Admin: admin@demo.edu / Admin@123');
  console.log('  Warden: warden@demo.edu / Warden@123');
  console.log('  Operator: operator@demo.edu / Operator@123');
  console.log('  Student: student@demo.edu / Student@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

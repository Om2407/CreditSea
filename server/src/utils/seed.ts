import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.model';
import { connectDB } from '../config/db';

const seedUsers = [
  { name: 'Admin User',        email: 'admin@lms.com',        password: 'admin123',        role: 'admin' },
  { name: 'Sales Executive',   email: 'sales@lms.com',        password: 'sales123',        role: 'sales' },
  { name: 'Sanction Officer',  email: 'sanction@lms.com',     password: 'sanction123',     role: 'sanction' },
  { name: 'Disburse Officer',  email: 'disburse@lms.com',     password: 'disburse123',     role: 'disbursement' },
  { name: 'Collection Agent',  email: 'collection@lms.com',   password: 'collection123',   role: 'collection' },
  { name: 'Test Borrower',     email: 'borrower@lms.com',     password: 'borrower123',     role: 'borrower' },
];

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Seeding users...\n');

  for (const userData of seedUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⚠️  Skipping ${userData.email} — already exists`);
      continue;
    }
    await User.create(userData);
    console.log(`✅ Created [${userData.role.padEnd(12)}] ${userData.email}  /  password: ${userData.password}`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('─'.repeat(55));
  console.log(' ROLE          EMAIL                    PASSWORD');
  console.log('─'.repeat(55));
  seedUsers.forEach(u => {
    console.log(` ${u.role.padEnd(13)} ${u.email.padEnd(24)} ${u.password}`);
  });
  console.log('─'.repeat(55));
  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Template from "./models/Template.js";
import Note from "./models/Note.js";
import Material from "./models/Material.js";
import Component from "./models/Component.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateMockData } from "./utils/mockDataGenerator.js";

const seedDatabase = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await connectDB();

    // ─────────────────────────────────────────────
    // CLEAN
    // ─────────────────────────────────────────────
    console.log("Cleaning collections...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Template.deleteMany({});
    await Note.deleteMany({});
    await Material.deleteMany({});
    await Component.deleteMany({});

    await generateMockData();

    console.log("✅ Database seeded successfully!");
    console.log(`   Users: 4 (admin + 3 lecturers)`);
    console.log(`   Categories: 6`);
    console.log(`   Products: 11`);
    console.log(`   Templates: 3 (newOrder, updateOrder, resetPassword) — all set as default`);
    console.log(`   Notes: 5`);
    console.log(`   Components: 3`);
    console.log(`   Materials (slider): 3`);
    console.log(`   Orders: 5 (pending, approved, rented, prepared, returned)`);
    console.log(`\n   Admin login: admin@gmail.com / admin`);
    console.log(`   Lecturer1: lecturer1@gmail.com / password`);
    console.log(`   Lecturer2: lecturer2@gmail.com / password`);
    console.log(`   Lecturer3: lecturer3@gmail.com / password`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
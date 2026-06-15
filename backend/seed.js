import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import bcrypt from "bcrypt";

const seedDatabase = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await connectDB();

    // Clear old data
    console.log("Cleaning collections...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    console.log("Seeding Users...");
    const admin = new User({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "admin",
      role: "admin",
      labRooms: ["101", "102", "201"],
    });

    const lecturer1 = new User({
      name: "Jan Kowalski",
      email: "lecturer1@gmail.com",
      password: "password",
      role: "lecturer",
      labRooms: ["101", "102"],
    });

    const lecturer2 = new User({
      name: "Anna Nowak",
      email: "lecturer2@gmail.com",
      password: "password",
      role: "lecturer",
      labRooms: ["201"],
    });

    await admin.save();
    await lecturer1.save();
    await lecturer2.save();

    console.log("Seeding Categories...");
    const catMicro = new Category({
      name: "Microcontrollers",
      description: "Arduino, ESP32, STM32 and other programmable boards.",
      isVisible: true,
    });

    const catSensors = new Category({
      name: "Sensors",
      description: "Temperature, humidity, motion, and distance sensors.",
      isVisible: true,
    });

    const catActuators = new Category({
      name: "Actuators",
      description: "Servo motors, relays, solenoids, and stepper motors.",
      isVisible: true,
    });

    const catSBC = new Category({
      name: "Single Board Computers",
      description: "Raspberry Pi, BeagleBone, Orange Pi, etc.",
      isVisible: true,
    });

    await catMicro.save();
    await catSensors.save();
    await catActuators.save();
    await catSBC.save();

    console.log("Seeding Products...");
    const prodArduino = new Product({
      name: "Arduino Uno R3",
      description: "The classic ATmega328P microcontroller board, perfect for learning electronics.",
      stockTotal: 10,
      stockForRent: 10,
      stockReserved: 0,
      stockRentedOut: 0,
      categories: [catMicro._id],
      tags: ["arduino", "uno", "microcontroller", "board"],
      labRoom: "101",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    const prodRaspPi = new Product({
      name: "Raspberry Pi 4 Model B (4GB)",
      description: "High-performance single board computer with Broadcom BCM2711 quad-core processor.",
      stockTotal: 5,
      stockForRent: 5,
      stockReserved: 1,
      stockRentedOut: 0,
      categories: [catSBC._id],
      tags: ["raspberrypi", "rpi", "sbc", "computer"],
      labRoom: "102",
      owner: admin._id,
      isRentable: true,
      isVisible: true,
    });

    const prodDHT11 = new Product({
      name: "DHT11 Temperature & Humidity Sensor",
      description: "Basic, low-cost digital temperature and humidity sensor with single-bus interface.",
      stockTotal: 20,
      stockForRent: 20,
      stockReserved: 2,
      stockRentedOut: 0,
      categories: [catSensors._id],
      tags: ["sensor", "dht11", "temperature", "humidity"],
      labRoom: "201",
      owner: lecturer2._id,
      isRentable: true,
      isVisible: true,
    });

    const prodServo = new Product({
      name: "SG90 Micro Servo Motor",
      description: "Tiny and lightweight 9g micro servo motor for RC helicopters, planes and robotics.",
      stockTotal: 15,
      stockForRent: 15,
      stockReserved: 0,
      stockRentedOut: 5,
      categories: [catActuators._id],
      tags: ["servo", "motor", "actuator", "sg90"],
      labRoom: "101",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    await prodArduino.save();
    await prodRaspPi.save();
    await prodDHT11.save();
    await prodServo.save();

    console.log("Seeding Orders...");
    
    // Order 1: Pending Order
    const order1 = new Order({
      uuid: "11111111-1111-1111-1111-111111111111",
      customerKey: await bcrypt.hash("key1", 10),
      customer: {
        firstName: "Jan",
        lastName: "Nowak",
        index: "123456",
        semester: 5,
        yearOfStudy: 3,
        fieldOfStudy: "Informatyka",
        specialization: "IoT Systems",
        phoneNumber: "123456789",
        email: "jannowak@gmail.com",
        purpose: "Building custom weather station using Arduino Uno R3 and SG90 servo motor.",
        notes: "Pending review"
      },
      items: [
        {
          product: prodArduino._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 2,
          assignedQuantity: 2,
          status: "pending"
        },
        {
          product: prodServo._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 3,
          assignedQuantity: 3,
          status: "pending"
        }
      ],
      requestedStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      requestedEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
    });

    // Order 2: Approved Order
    const order2 = new Order({
      uuid: "22222222-2222-2222-2222-222222222222",
      customerKey: await bcrypt.hash("key2", 10),
      customer: {
        firstName: "Kasia",
        lastName: "Kowalska",
        index: "654321",
        semester: 3,
        yearOfStudy: 2,
        fieldOfStudy: "Telekomunikacja",
        specialization: "Embedded Systems",
        phoneNumber: "987654321",
        email: "kasiakowalska@gmail.com",
        purpose: "Researching temperature telemetry scripts using Raspberry Pi and DHT11 sensors.",
        notes: "Approved by administrator"
      },
      items: [
        {
          product: prodRaspPi._id,
          responsibleOwner: admin._id,
          requestedQuantity: 1,
          assignedQuantity: 1,
          status: "approved"
        },
        {
          product: prodDHT11._id,
          responsibleOwner: lecturer2._id,
          requestedQuantity: 2,
          assignedQuantity: 2,
          status: "approved"
        }
      ],
      requestedStartDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // in 2 days
      requestedEndDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // in 6 days
    });

    // Order 3: Rented Order
    const order3 = new Order({
      uuid: "33333333-3333-3333-3333-333333333333",
      customerKey: await bcrypt.hash("key3", 10),
      customer: {
        firstName: "Tomasz",
        lastName: "Bąk",
        index: "111111",
        semester: 6,
        yearOfStudy: 3,
        fieldOfStudy: "Automatyka",
        specialization: "Robotics",
        phoneNumber: "111222333",
        email: "tomaszbak@gmail.com",
        purpose: "Robotic arm servo drive testing and feedback response mapping.",
        notes: "Rented out for robotics class work"
      },
      items: [
        {
          product: prodServo._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 5,
          assignedQuantity: 5,
          status: "rented"
        }
      ],
      requestedStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      requestedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
    });

    await order1.save();
    await order2.save();
    await order3.save();

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
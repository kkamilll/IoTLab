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
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

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

    // ─────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────
    console.log("Seeding Users...");

    const admin = new User({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "admin",
      role: "admin",
      labRooms: ["101", "102", "201", "301"],
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

    const lecturer3 = new User({
      name: "Piotr Wiśniewski",
      email: "lecturer3@gmail.com",
      password: "password",
      role: "lecturer",
      labRooms: ["301", "102"],
    });

    await admin.save();
    await lecturer1.save();
    await lecturer2.save();
    await lecturer3.save();

    // ─────────────────────────────────────────────
    // CATEGORIES
    // ─────────────────────────────────────────────
    console.log("Seeding Categories...");

    const catMicro = new Category({
      name: "Microcontrollers",
      description: "Arduino, ESP32, STM32 and other programmable boards.",
      isVisible: true,
    });

    const catSensors = new Category({
      name: "Sensors",
      description: "Temperature, humidity, motion, distance and gas sensors.",
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

    const catNetworking = new Category({
      name: "Networking Modules",
      description: "WiFi, Bluetooth, Zigbee, LoRa and Ethernet modules.",
      isVisible: true,
    });

    const catPower = new Category({
      name: "Power & Supplies",
      description: "Power supplies, voltage regulators, batteries and UPS modules.",
      isVisible: false,
    });

    await catMicro.save();
    await catSensors.save();
    await catActuators.save();
    await catSBC.save();
    await catNetworking.save();
    await catPower.save();

    // ─────────────────────────────────────────────
    // PRODUCTS
    // ─────────────────────────────────────────────
    console.log("Seeding Products...");

    const prodArduino = new Product({
      name: "Arduino Uno R3",
      description: "The classic ATmega328P microcontroller board, perfect for learning electronics and prototyping.",
      stockTotal: 15,
      stockForRent: 15,
      stockReserved: 2,
      stockRentedOut: 0,
      categories: [catMicro._id],
      tags: ["arduino", "uno", "microcontroller", "board", "atmega"],
      labRoom: "101",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    const prodESP32 = new Product({
      name: "ESP32 DevKit V1",
      description: "Dual-core 240MHz microcontroller with built-in WiFi and Bluetooth. Ideal for IoT projects.",
      stockTotal: 20,
      stockForRent: 20,
      stockReserved: 0,
      stockRentedOut: 3,
      categories: [catMicro._id, catNetworking._id],
      tags: ["esp32", "wifi", "bluetooth", "iot", "microcontroller"],
      labRoom: "101",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    const prodSTM32 = new Product({
      name: "STM32 Nucleo-64",
      description: "STM32 development board with 64-pin ARM Cortex-M4 processor and Arduino-compatible headers.",
      stockTotal: 8,
      stockForRent: 8,
      stockReserved: 1,
      stockRentedOut: 0,
      categories: [catMicro._id],
      tags: ["stm32", "arm", "cortex", "nucleo", "embedded"],
      labRoom: "102",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    const prodRaspPi = new Product({
      name: "Raspberry Pi 4 Model B (4GB)",
      description: "High-performance single board computer with Broadcom BCM2711 quad-core processor. Great for edge computing.",
      stockTotal: 6,
      stockForRent: 6,
      stockReserved: 1,
      stockRentedOut: 1,
      categories: [catSBC._id],
      tags: ["raspberrypi", "rpi", "sbc", "linux", "computer"],
      labRoom: "102",
      owner: admin._id,
      isRentable: true,
      isVisible: true,
    });

    const prodRaspPi5 = new Product({
      name: "Raspberry Pi 5 (8GB)",
      description: "Latest generation RPi with 2.4GHz quad-core Arm Cortex-A76 processor and PCIe 2.0 interface.",
      stockTotal: 4,
      stockForRent: 4,
      stockReserved: 0,
      stockRentedOut: 0,
      categories: [catSBC._id],
      tags: ["raspberrypi", "rpi5", "sbc", "linux", "newest"],
      labRoom: "102",
      owner: admin._id,
      isRentable: true,
      isVisible: true,
    });

    const prodDHT11 = new Product({
      name: "DHT11 Temperature & Humidity Sensor",
      description: "Basic, low-cost digital temperature and humidity sensor with single-bus interface.",
      stockTotal: 25,
      stockForRent: 25,
      stockReserved: 3,
      stockRentedOut: 0,
      categories: [catSensors._id],
      tags: ["sensor", "dht11", "temperature", "humidity", "analog"],
      labRoom: "201",
      owner: lecturer2._id,
      isRentable: true,
      isVisible: true,
    });

    const prodDHT22 = new Product({
      name: "DHT22 Temperature & Humidity Sensor",
      description: "High-precision digital temperature (-40 to +80°C) and humidity sensor, upgrade from DHT11.",
      stockTotal: 15,
      stockForRent: 15,
      stockReserved: 0,
      stockRentedOut: 2,
      categories: [catSensors._id],
      tags: ["sensor", "dht22", "temperature", "humidity", "precision"],
      labRoom: "201",
      owner: lecturer2._id,
      isRentable: true,
      isVisible: true,
    });

    const prodUltrasonic = new Product({
      name: "HC-SR04 Ultrasonic Distance Sensor",
      description: "Ultrasonic ranging module with 2cm–400cm measurement range. Perfect for robotics and obstacle avoidance.",
      stockTotal: 20,
      stockForRent: 20,
      stockReserved: 0,
      stockRentedOut: 0,
      categories: [catSensors._id],
      tags: ["sensor", "ultrasonic", "hcsr04", "distance", "range"],
      labRoom: "201",
      owner: lecturer2._id,
      isRentable: true,
      isVisible: true,
    });

    const prodServo = new Product({
      name: "SG90 Micro Servo Motor",
      description: "Tiny and lightweight 9g micro servo motor for RC helicopters, planes and robotics projects.",
      stockTotal: 20,
      stockForRent: 20,
      stockReserved: 0,
      stockRentedOut: 5,
      categories: [catActuators._id],
      tags: ["servo", "motor", "actuator", "sg90", "robotics"],
      labRoom: "101",
      owner: lecturer1._id,
      isRentable: true,
      isVisible: true,
    });

    const prodRelay = new Product({
      name: "5V Relay Module (4-channel)",
      description: "4-channel relay module for controlling high-voltage AC/DC loads from microcontrollers.",
      stockTotal: 10,
      stockForRent: 10,
      stockReserved: 0,
      stockRentedOut: 0,
      categories: [catActuators._id],
      tags: ["relay", "actuator", "module", "4channel", "control"],
      labRoom: "301",
      owner: lecturer3._id,
      isRentable: true,
      isVisible: true,
    });

    const prodLoRa = new Product({
      name: "LoRa32 Module (SX1276)",
      description: "Long-range radio communication module operating at 868/915MHz with up to 10km range.",
      stockTotal: 8,
      stockForRent: 8,
      stockReserved: 0,
      stockRentedOut: 0,
      categories: [catNetworking._id],
      tags: ["lora", "radio", "longrange", "sx1276", "wireless"],
      labRoom: "301",
      owner: lecturer3._id,
      isRentable: true,
      isVisible: true,
    });

    await prodArduino.save();
    await prodESP32.save();
    await prodSTM32.save();
    await prodRaspPi.save();
    await prodRaspPi5.save();
    await prodDHT11.save();
    await prodDHT22.save();
    await prodUltrasonic.save();
    await prodServo.save();
    await prodRelay.save();
    await prodLoRa.save();

    // ─────────────────────────────────────────────
    // EMAIL TEMPLATES (required for emails to work)
    // ─────────────────────────────────────────────
    console.log("Seeding Email Templates...");

    const templateNewOrder = new Template({
      name: "newOrder",
      subject: "✅ Twoje zamówienie zostało złożone – IoTLab",
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#4f46e5;font-size:24px;margin:0;">🔬 IoTLab</h1>
    <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color:#1e293b;font-size:18px;">Cześć \${CustomerName}!</h2>
  <p style="color:#475569;line-height:1.6;">Twoje zamówienie zostało pomyślnie złożone i oczekuje na weryfikację przez opiekuna laboratorium.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Numer zamówienia</p>
    <p style="margin:0;color:#1e293b;font-family:monospace;font-size:14px;">\${orderId}</p>
  </div>
  <p style="color:#475569;line-height:1.6;">Możesz śledzić status swojego zamówienia klikając w poniższy link. Będziesz potrzebować hasła, które podajemy poniżej:</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="\${orderLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">📋 Śledź zamówienie</a>
  </div>
  <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:16px 0;">
    <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:bold;">🔑 Hasło dostępu do zamówienia:</p>
    <p style="margin:0;color:#1e293b;font-family:monospace;font-size:16px;font-weight:bold;">\${orderPassword}</p>
    <p style="margin:4px 0 0;color:#92400e;font-size:11px;">Zachowaj to hasło – będzie potrzebne do sprawdzenia statusu.</p>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
  <p style="color:#94a3b8;font-size:11px;text-align:center;">IoTLab · Politechnika · ul. Akademicka 1<br>Ta wiadomość została wygenerowana automatycznie – prosimy nie odpowiadać.</p>
</div>`,
      isDefault: true,
    });

    const templateUpdateOrder = new Template({
      name: "updateOrder",
      subject: "🔄 Status Twojego zamówienia został zaktualizowany – IoTLab",
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#4f46e5;font-size:24px;margin:0;">🔬 IoTLab</h1>
    <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color:#1e293b;font-size:18px;">Cześć \${CustomerName}!</h2>
  <p style="color:#475569;line-height:1.6;">Informujemy, że status Twojego zamówienia uległ zmianie. Sprawdź aktualne informacje poniżej.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Numer zamówienia</p>
    <p style="margin:0;color:#1e293b;font-family:monospace;font-size:14px;">\${orderId}</p>
  </div>
  <p style="color:#475569;line-height:1.6;">W razie pytań skontaktuj się z opiekunem laboratorium lub odwiedź panel zamówienia.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
  <p style="color:#94a3b8;font-size:11px;text-align:center;">IoTLab · Politechnika · ul. Akademicka 1<br>Ta wiadomość została wygenerowana automatycznie – prosimy nie odpowiadać.</p>
</div>`,
      isDefault: true,
    });

    const templateResetPassword = new Template({
      name: "resetPassword",
      subject: "🔐 Kod weryfikacyjny do resetowania hasła – IoTLab",
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#4f46e5;font-size:24px;margin:0;">🔬 IoTLab</h1>
    <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color:#1e293b;font-size:18px;">Reset hasła</h2>
  <p style="color:#475569;line-height:1.6;">Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Użyj poniższego kodu weryfikacyjnego:</p>
  <div style="text-align:center;margin:28px 0;">
    <div style="display:inline-block;background:#4f46e5;color:#fff;font-size:32px;font-weight:bold;font-family:monospace;padding:16px 32px;border-radius:12px;letter-spacing:8px;">
      \${VerificationCode}
    </div>
  </div>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0;">
    <p style="margin:0;color:#991b1b;font-size:13px;">⏱️ Ten kod jest ważny przez <strong>15 minut</strong>. Nie udostępniaj go nikomu.</p>
  </div>
  <p style="color:#475569;line-height:1.6;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość – Twoje konto jest bezpieczne.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
  <p style="color:#94a3b8;font-size:11px;text-align:center;">IoTLab · Politechnika · ul. Akademicka 1<br>Ta wiadomość została wygenerowana automatycznie – prosimy nie odpowiadać.</p>
</div>`,
      isDefault: true,
    });

    await templateNewOrder.save();
    await templateUpdateOrder.save();
    await templateResetPassword.save();

    // ─────────────────────────────────────────────
    // NOTES
    // ─────────────────────────────────────────────
    console.log("Seeding Notes...");

    const note1 = new Note({
      text: "Laboratorium jest czynne od poniedziałku do piątku w godzinach 8:00–20:00. W weekendy dostępne tylko po wcześniejszej rezerwacji u opiekuna.",
      author: admin._id,
      important: false,
    });

    const note2 = new Note({
      text: "⚠️ WAŻNE: Przed wypożyczeniem sprzętu prosimy o zapoznanie się z regulaminem laboratorium dostępnym na stronie wydziału. Każde uszkodzenie sprzętu zostanie rozliczone z kaucji.",
      author: admin._id,
      important: true,
    });

    const note3 = new Note({
      text: "Nowy zestaw Raspberry Pi 5 (8GB) jest już dostępny do wypożyczenia! Skontaktuj się z dr inż. Anną Nowak w celu rezerwacji. Priorytet mają projekty inżynierskie.",
      author: lecturer2._id,
      important: false,
    });

    const note4 = new Note({
      text: "Przypomnienie: Wszelkie zamówienia sprzętu na sesję egzaminacyjną (czerwiec/lipiec) należy składać minimum 2 tygodnie przed planowanym terminem. Ograniczona dostępność!",
      author: lecturer1._id,
      important: true,
    });

    const note5 = new Note({
      text: "W laboratorium 301 dostępne są nowe moduły LoRa (SX1276) oraz zestawy do Mesh Networking. Idealne dla projektów z zakresu Smart City i przemysłowego IoT. Więcej info u dr. Piotra Wiśniewskiego.",
      author: lecturer3._id,
      important: false,
    });

    await note1.save();
    await note2.save();
    await note3.save();
    await note4.save();
    await note5.save();

    // ─────────────────────────────────────────────
    // MATERIALS (Slider)
    // ─────────────────────────────────────────────
    console.log("Seeding Materials (Slider)...");

    // Note: path is a placeholder – physical files don't exist in seed.
    // Real materials are uploaded via the admin panel.
    const mat1 = new Material({
      filename: "slide1.jpg",
      path: "uploads/materials/slide1.jpg",
      link: "https://www.put.poznan.pl",
      author: admin._id,
      order: 1,
    });

    const mat2 = new Material({
      filename: "slide2.jpg",
      path: "uploads/materials/slide2.jpg",
      link: null,
      author: admin._id,
      order: 2,
    });

    const mat3 = new Material({
      filename: "slide3.jpg",
      path: "uploads/materials/slide3.jpg",
      link: "https://www.embedded.pl",
      author: lecturer3._id,
      order: 3,
    });

    await mat1.save();
    await mat2.save();
    await mat3.save();

    // ─────────────────────────────────────────────
    // ORDERS
    // ─────────────────────────────────────────────
    console.log("Seeding Orders...");

    const now = Date.now();

    // Order 1: Pending – upcoming
    const order1 = new Order({
      uuid: uuidv4(),
      customerKey: await bcrypt.hash("key-order-1", 10),
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
        purpose: "Budowa stacji meteorologicznej z wykorzystaniem Arduino Uno R3 i sensorów DHT22 do projektu dyplomowego.",
        notes: "Oczekuje na weryfikację"
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
          product: prodDHT22._id,
          responsibleOwner: lecturer2._id,
          requestedQuantity: 4,
          assignedQuantity: 4,
          status: "pending"
        },
      ],
      requestedStartDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
      requestedEndDate: new Date(now + 9 * 24 * 60 * 60 * 1000),
    });

    // Order 2: Approved – starts tomorrow
    const order2 = new Order({
      uuid: uuidv4(),
      customerKey: await bcrypt.hash("key-order-2", 10),
      customer: {
        firstName: "Katarzyna",
        lastName: "Kowalska",
        index: "654321",
        semester: 3,
        yearOfStudy: 2,
        fieldOfStudy: "Telekomunikacja",
        specialization: "Embedded Systems",
        phoneNumber: "987654321",
        email: "kasiakowalska@gmail.com",
        purpose: "Badania telemetrii temperatury za pomocą Raspberry Pi 4 i sensorów DHT11 – projekt semestralny.",
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
          requestedQuantity: 3,
          assignedQuantity: 3,
          status: "approved"
        },
      ],
      requestedStartDate: new Date(now + 24 * 60 * 60 * 1000),
      requestedEndDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
    });

    // Order 3: Active rental (rented)
    const order3 = new Order({
      uuid: uuidv4(),
      customerKey: await bcrypt.hash("key-order-3", 10),
      customer: {
        firstName: "Tomasz",
        lastName: "Bąk",
        index: "111111",
        semester: 6,
        yearOfStudy: 3,
        fieldOfStudy: "Automatyka i Robotyka",
        specialization: "Robotics",
        phoneNumber: "111222333",
        email: "tomaszbak@gmail.com",
        purpose: "Testowanie napędów serwa i mapowanie odpowiedzi – ramię robotyczne klasy przemysłowej.",
      },
      items: [
        {
          product: prodServo._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 5,
          assignedQuantity: 5,
          status: "rented"
        },
        {
          product: prodUltrasonic._id,
          responsibleOwner: lecturer2._id,
          requestedQuantity: 2,
          assignedQuantity: 2,
          status: "rented"
        },
      ],
      requestedStartDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
      requestedEndDate: new Date(now + 4 * 24 * 60 * 60 * 1000),
    });

    // Order 4: Prepared (ready for pickup)
    const order4 = new Order({
      uuid: uuidv4(),
      customerKey: await bcrypt.hash("key-order-4", 10),
      customer: {
        firstName: "Alicja",
        lastName: "Zielińska",
        index: "222333",
        semester: 4,
        yearOfStudy: 2,
        fieldOfStudy: "Elektronika i Telekomunikacja",
        specialization: "Wireless Systems",
        phoneNumber: "444555666",
        email: "alicja.zielinska@student.pl",
        purpose: "Projekt LoRa Mesh Network do komunikacji między węzłami w budynku wydziału.",
      },
      items: [
        {
          product: prodLoRa._id,
          responsibleOwner: lecturer3._id,
          requestedQuantity: 4,
          assignedQuantity: 4,
          status: "prepared"
        },
        {
          product: prodESP32._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 4,
          assignedQuantity: 4,
          status: "prepared"
        },
      ],
      requestedStartDate: new Date(now + 12 * 60 * 60 * 1000),
      requestedEndDate: new Date(now + 6 * 24 * 60 * 60 * 1000),
    });

    // Order 5: Returned (completed)
    const order5 = new Order({
      uuid: uuidv4(),
      customerKey: await bcrypt.hash("key-order-5", 10),
      customer: {
        firstName: "Marcin",
        lastName: "Dąbrowski",
        index: "999888",
        semester: 7,
        yearOfStudy: 4,
        fieldOfStudy: "Informatyka",
        specialization: "Systemy Wbudowane",
        phoneNumber: "777888999",
        email: "marcin.dabrowski@student.pl",
        purpose: "Projekt dyplomowy: inteligentny system zarządzania energią z STM32 i modułem przekaźnikowym.",
      },
      items: [
        {
          product: prodSTM32._id,
          responsibleOwner: lecturer1._id,
          requestedQuantity: 2,
          assignedQuantity: 2,
          status: "returned"
        },
        {
          product: prodRelay._id,
          responsibleOwner: lecturer3._id,
          requestedQuantity: 2,
          assignedQuantity: 2,
          status: "returned"
        },
      ],
      requestedStartDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
      requestedEndDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
    });

    await order1.save();
    await order2.save();
    await order3.save();
    await order4.save();
    await order5.save();

    console.log("✅ Database seeded successfully!");
    console.log(`   Users: 4 (admin + 3 lecturers)`);
    console.log(`   Categories: 6`);
    console.log(`   Products: 11`);
    console.log(`   Templates: 3 (newOrder, updateOrder, resetPassword) — all set as default`);
    console.log(`   Notes: 5`);
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
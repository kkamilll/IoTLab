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
import Notification from "./models/Notification.js";
import bcrypt from "bcrypt";

const initDatabase = async () => {
  try {
    console.log("Connecting to database for initialization...");
    await connectDB();

    // ─────────────────────────────────────────────
    // CLEAN
    // ─────────────────────────────────────────────
    console.log("Cleaning ALL collections...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Template.deleteMany({});
    await Note.deleteMany({});
    await Material.deleteMany({});
    await Component.deleteMany({});
    await Notification.deleteMany({});

    // ─────────────────────────────────────────────
    // BASE SETUP (Admin & Templates)
    // ─────────────────────────────────────────────
    console.log("Seeding Base Requirements (Admin user and Email Templates)...");

    const admin = new User({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "admin",
      role: "admin",
      labRooms: ["101", "102"],
    });

    await admin.save();

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

    console.log("✅ Database initialized successfully for a fresh deployment!");
    console.log(`   Admin login: admin@gmail.com / admin`);
    console.log(`   Templates: newOrder, updateOrder, resetPassword`);
    console.log(`   (Everything else is completely empty.)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

initDatabase();

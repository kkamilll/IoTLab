import mongoose from "mongoose";
import Template from "../models/Template.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connection created successfully");

    // Seed default templates if they don't exist
    const defaultTemplates = [
      {
        name: "newOrder",
        subject: "Order Confirmation - ${orderId}",
        body: "<p>Hello ${CustomerName},</p><p>Your order <b>${orderId}</b> has been received!</p><p>You can check the status of your order at: <a href='${orderLink}'>${orderLink}</a></p><p>Your order password is: <b>${orderPassword}</b></p>",
        isDefault: true,
      },
      {
        name: "updateOrder",
        subject: "Order Update - ${orderId}",
        body: "<p>Hello ${CustomerName},</p><p>Your order <b>${orderId}</b> has been updated. Please log in to check the current status.</p>",
        isDefault: true,
      },
      {
        name: "resetPassword",
        subject: "Reset Password Verification Code",
        body: "<p>Your verification code is: <b>${VerificationCode}</b></p><p>This code is valid for 15 minutes.</p>",
        isDefault: true,
      },
    ];

    for (const t of defaultTemplates) {
      const exists = await Template.findOne({ name: t.name });
      if (!exists) {
        await Template.create(t);
        console.log(`Seeded default template: ${t.name}`);
      }
    }
    return conn;
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
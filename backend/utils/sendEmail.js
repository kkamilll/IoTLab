import nodeMailer from "nodemailer";
import { BadRequestError, ResourceNotFoundError } from "../errors/CustomErrors.js";

import Template from "../models/Template.js";

export const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    // console.log(`Order email sent to ${email}`); // now this will run if successful

  } catch (error) {
    throw error;
  }
};

export const sendOrderEmail = async (order, customerKey = null, uuid = null) => {
  try {
    if (!order) throw new ResourceNotFoundError("Missing order");

    const type = customerKey && uuid ? "newOrder" : "updateOrder";

    const email = order.customer?.email;
    if (!email) throw new BadRequestError("Missing customer's email");

    const orderId = order._id.toString();
    const CustomerName = `${order.customer.firstName} ${order.customer.lastName}`;
    const orderLink = `${process.env.FRONTEND_IP}${process.env.FRONTEND_PORT}${process.env.FRONTEND_ORDER_PATH}/${uuid}`;
    const orderPassword = customerKey;
    const templateVariables = { orderId, CustomerName, orderLink, orderPassword };

    const template = await Template.findOne({ name: type, isDefault: true }).lean();
    if (!template) throw new ResourceNotFoundError(`No default template found for ${type}`);

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(templateVariables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, "g"); // matches ${key}
      subject = subject.replace(regex, value ?? "");
      body = body.replace(regex, value ?? "");
    }

    await sendEmail(email, subject, body);
    // console.log(`Order ${type} email sent to ${email}`);
  } catch (error) {
    throw error;
  }
};

export async function sendVerificationCode(otpCode, email, res) {
  try {
    // const resetLink = `http://${process.env.FRONTEND_IP}${process.env.FRONTEND_PORT}/reset-password?email=${encodeURIComponent(email)}`;
    const templateVariables = { VerificationCode: otpCode };
    // console.log(templateVariables);

    const template = await Template.findOne({ name: "resetPassword", isDefault: true }).lean();
    if (!template) {
      return res.status(500).json({
        success: false,
        message: "Email template not found",
      });
    }

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(templateVariables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, "g"); // matches ${key}
      subject = subject.replace(regex, value ?? "");
      body = body.replace(regex, value ?? "");
    }

    await sendEmail(email, subject, body);
  } catch (error) {
    throw error;
  }
}
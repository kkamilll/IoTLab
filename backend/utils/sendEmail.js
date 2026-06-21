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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f9fafb;
              padding: 20px;
              margin: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              padding: 24px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 20px;
              color: #2563eb;
              margin-bottom: 16px;
            }
            p {
              line-height: 1.6;
              margin-bottom: 12px;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #888;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${subject}</h1>
            ${message}
            <div class="footer">
              <p>Thanks for choosing our service 🚀</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html: htmlContent,
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
    const orderLink = `${process.env.FRONTEND_IP}${process.env.FRONTEND_PORT}${process.env.FRONTEND_ORDER_PATH}/${uuid || order.uuid}`;
    const orderPassword = customerKey;
    const startDate = new Date(order.requestedStartDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const endDate = new Date(order.requestedEndDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const templateVariables = { orderId, CustomerName, orderLink, orderPassword, startDate, endDate };

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
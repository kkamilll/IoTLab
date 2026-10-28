import nodeMailer from "nodemailer";
import { BadRequestError, ResourceNotFoundError } from "../errors/CustomErrors.js";
import User from "../models/User.js";
import Template from "../models/Template.js";
import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js";

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
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f8fafc;
              padding: 40px 20px;
              margin: 0;
              color: #334155;
            }
            .wrapper {
              max-width: 640px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
              border-radius: 12px 12px 0 0;
              padding: 32px 40px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .content {
              background-color: #ffffff;
              padding: 40px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
              border: 1px solid #e2e8f0;
              border-top: none;
            }
            .content p {
              font-size: 15px;
              line-height: 1.7;
              margin-bottom: 20px;
              color: #475569;
            }
            .content a {
              color: #4f46e5;
              text-decoration: none;
              font-weight: 600;
            }
            .content a:hover {
              text-decoration: underline;
            }
            .footer {
              margin-top: 32px;
              text-align: center;
            }
            .footer p {
              font-size: 13px;
              color: #94a3b8;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              ${message}
            </div>
            <div class="footer">
              <p>System Wypożyczalni Sprzętu Laboratoryjnego</p>
              <p>&copy; ${new Date().getFullYear()} Wszelkie prawa zastrzeżone.</p>
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
    const startDate = new Date(order.requestedStartDate).toLocaleDateString("pl-PL");
    const endDate = new Date(order.requestedEndDate).toLocaleDateString("pl-PL");
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
  } catch (error) {
    throw error;
  }
};

export async function sendVerificationCode(otpCode, email) {
  const templateVariables = { VerificationCode: otpCode };

  let subject = "Kod weryfikacyjny do zresetowania hasła";
  let body = generateVerificationOtpEmailTemplate(otpCode);

  try {
    const template = await Template.findOne({ name: "resetPassword", isDefault: true }).lean();
    if (template) {
      subject = template.subject || subject;
      body = template.body || body;

      for (const [key, value] of Object.entries(templateVariables)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, "g");
        subject = subject.replace(regex, value ?? "");
        body = body.replace(regex, value ?? "");
      }
    }
  } catch (dbErr) {
    console.warn("Could not load resetPassword template from DB, using fallback template:", dbErr.message);
  }

  await sendEmail(email, subject, body);
}

export const sendOwnerNotificationEmail = async (ownerEmail, order) => {
  try {
    if (!order) throw new ResourceNotFoundError("Missing order");
    if (!ownerEmail) throw new BadRequestError("Missing owner email");

    const CustomerName = `${order.customer.firstName} ${order.customer.lastName}`;
    const subject = "Nowe żądanie wypożyczenia sprzętu";
    const body = `
      <p>Witaj,</p>
      <p>Student <strong>${CustomerName}</strong> (indeks: ${order.customer.index}) złożył nowe zapotrzebowanie na wypożyczenie przedmiotów z Twojej puli sprzętowej.</p>
      <p>Zaloguj się do panelu administratora, aby sprawdzić szczegóły i zatwierdzić zamówienie.</p>
      <br/>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_IP}${process.env.FRONTEND_PORT}/admin-dashboard/orders" 
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
          Przejdź do zamówień
        </a>
      </div>
    `;

    await sendEmail(ownerEmail, subject, body);
  } catch (error) {
    console.error("Error sending owner notification:", error);
  }
};

export const sendReturnReminderEmail = async (email, order, isLate = false) => {
  try {
    if (!order) throw new ResourceNotFoundError("Missing order");
    if (!email) throw new BadRequestError("Missing customer email");

    const templateName = isLate ? "overdueAlert" : "returnReminder";
    const orderId = order.uuid?.substring(0, 8) || order._id.toString();
    const CustomerName = `${order.customer.firstName} ${order.customer.lastName}`;
    const rawDueDate = order.assignedEndDate || order.requestedEndDate;
    const dueDate = rawDueDate ? new Date(rawDueDate).toLocaleDateString("pl-PL") : "wkrótce";
    const frontendUrl = process.env.FRONTEND_IP
      ? `${process.env.FRONTEND_IP}${process.env.FRONTEND_PORT ? `:${process.env.FRONTEND_PORT}` : ""}`
      : "http://localhost:5173";
    const orderLink = `${frontendUrl}${process.env.FRONTEND_ORDER_PATH || "/order"}/${order.uuid || order._id}`;

    const templateVariables = { orderId, CustomerName, dueDate, orderLink };

    let subject = isLate
      ? `PILNE: Przekroczono termin zwrotu sprzętu - ${orderId}`
      : `Przypomnienie o terminie zwrotu sprzętu - ${orderId}`;
    let body = isLate
      ? `<p>Witaj <strong>${CustomerName}</strong>,</p><p style="color: #dc2626;"><b>Uwaga:</b> Minął termin zwrotu wypożyczonego sprzętu w zamówieniu <b>#${orderId}</b> (termin: ${dueDate}).</p><p>Prosimy o <b>natychmiastowy zwrot</b> sprzętu do laboratorium lub niezwłoczny kontakt z opiekunem sprzętu.</p>`
      : `<p>Witaj <strong>${CustomerName}</strong>,</p><p>Przypominamy, że zbliża się termin zwrotu sprzętu z Twojego zamówienia <b>#${orderId}</b> (termin: ${dueDate}).</p><p>Prosimy o terminowe dostarczenie wypożyczonych komponentów do laboratorium.</p>`;

    try {
      const template = await Template.findOne({ name: templateName, isDefault: true }).lean();
      if (template) {
        subject = template.subject || subject;
        body = template.body || body;

        for (const [key, value] of Object.entries(templateVariables)) {
          const regex = new RegExp(`\\$\\{${key}\\}`, "g");
          subject = subject.replace(regex, value ?? "");
          body = body.replace(regex, value ?? "");
        }
      }
    } catch (dbErr) {
      console.warn(`Could not load ${templateName} template from DB, using fallback:`, dbErr.message);
    }

    await sendEmail(email, subject, body);
  } catch (error) {
    console.error("Error sending reminder email:", error);
  }
};
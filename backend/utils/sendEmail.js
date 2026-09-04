import nodeMailer from "nodemailer";
import { BadRequestError, ResourceNotFoundError } from "../errors/CustomErrors.js";
import User from "../models/User.js";
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
  } catch (error) {
    throw error;
  }
};

export async function sendVerificationCode(otpCode, email, res) {
  try {
    const templateVariables = { VerificationCode: otpCode };

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

    const CustomerName = `${order.customer.firstName} ${order.customer.lastName}`;
    const subject = isLate ? "Pilne: Przekroczony termin zwrotu sprzętu!" : "Przypomnienie o zbliżającym się terminie zwrotu sprzętu";
    const headerColor = isLate ? "linear-gradient(135deg, #ef4444 0%, #f87171 100%)" : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
    
    const customHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0; color: #334155; }
            .wrapper { max-width: 640px; margin: 0 auto; }
            .header { background: ${headerColor}; border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center; }
            .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
            .content { background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; border-top: none; }
            .content p { font-size: 15px; line-height: 1.7; margin-bottom: 20px; color: #475569; }
            .footer { margin-top: 32px; text-align: center; }
            .footer p { font-size: 13px; color: #94a3b8; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              <p>Witaj <strong>${CustomerName}</strong>,</p>
              <p>${isLate 
                ? "Informujemy, że <strong>przekroczyłeś termin zwrotu</strong> wypożyczonego sprzętu. Prosimy o jego natychmiastowy zwrot do laboratorium!" 
                : "Przypominamy, że jutro mija termin zwrotu sprzętu z Twojego zamówienia. Prosimy o terminowy zwrot."}</p>
              <p>Skontaktuj się z wykładowcą w razie jakichkolwiek problemów.</p>
            </div>
            <div class="footer">
              <p>System Wypożyczalni Sprzętu Laboratoryjnego</p>
              <p>&copy; ${new Date().getFullYear()} Wszelkie prawa zastrzeżone.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const transporter = nodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_MAIL, pass: process.env.SMTP_PASSWORD },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html: customHtmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending reminder email:", error);
  }
};
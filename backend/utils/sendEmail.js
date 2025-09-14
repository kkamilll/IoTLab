import nodeMailer from "nodemailer";

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
    console.log(`Order email sent to ${email}`); // now this will run if successful

  } catch (err) {
    console.error("Failed to send email:", err); // <-- this will show why it's failing
  }
};
import { sendEmail } from './sendEmail.js';
import { generateVerificationOtpEmailTemplate } from './emailTemplates.js';


export async function sendVerificationCode(verificationCode, email, res) {
  try {
    const resetLink = `http://localhost:${process.env.PORT}/reset-password?email=${encodeURIComponent(email)}`;
    // const message = 
    //   `${generateVerificationOtpEmailTemplate(verificationCode)}
    //   <p style="color:#ccc;">Lub kliknij tutaj, aby przejść do resetu hasła: 
    //   <a href="${resetLink}" style="color:#4ea1ff;">${resetLink}</a></p>`;

    const template = await Template.findOne({ name: "resetPassword", isDefault: true }).lean();
    if (!template) {
      return res.status(500).json({
        success: false,
        message: "Email template not found",
      });
    }

    let subject = template.subject;
    let message = template.body;

    for (const [key, value] of Object.entries(templateVariables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, "g"); // matches ${key}
      subject = subject.replace(regex, value ?? "");
      body = body.replace(regex, value ?? "");
    }

    await sendEmail(email, subject, message);

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);

  }
}

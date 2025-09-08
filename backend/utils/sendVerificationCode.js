import { sendEmail } from './sendEmail.js';
import { generateVerificationOtpEmailTemplate } from './emailTemplates.js';


export async function sendVerificationCode(verificationCode, email, res) {
  try {
    const resetLink = `${import.meta.env.VITE_FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}`;
    const message = 
      `${generateVerificationOtpEmailTemplate(verificationCode)}
      <p style="color:#ccc;">Lub kliknij tutaj, aby przejść do resetu hasła: 
      <a href="${resetLink}" style="color:#4ea1ff;">${resetLink}</a></p>`;

    await sendEmail(
      email,
      "Verification Code (Bookworm Library Management System)",
      message
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Verification code failed to send.",
    });
  }
}

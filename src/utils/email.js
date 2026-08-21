import nodemailer from 'nodemailer';

/**
 * Creates and returns a nodemailer transporter.
 * Uses SMTP env vars — works with Gmail, Mailtrap, Resend SMTP, SendGrid, etc.
 * For Mailtrap (dev): set EMAIL_HOST=sandbox.smtp.mailtrap.io, EMAIL_PORT=587
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends a password-reset email with a styled HTML body.
 *
 * @param {string} to        - Recipient email address
 * @param {string} resetUrl  - Full reset URL (e.g. https://tekschool.in/reset-password/<token>)
 * @param {string} name      - Recipient's display name (optional)
 */
export const sendPasswordResetEmail = async (to, resetUrl, name = 'there') => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Reset your TekSchool password</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:16px;overflow:hidden;
                     box-shadow:0 4px 24px rgba(30,27,75,0.10);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1E1B4B 0%,#2D5FA8 100%);
                            padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;
                             letter-spacing:-0.5px;">TekSchool</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.70);font-size:13px;">
                    Password Reset Request
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 16px;color:#1E1B4B;font-size:16px;font-weight:600;">
                    Hi ${name},
                  </p>
                  <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                    We received a request to reset your TekSchool password.
                    Click the button below — this link expires in
                    <strong>10 minutes</strong>.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td align="center"
                          style="background:linear-gradient(135deg,#1E1B4B,#2D5FA8);
                                 border-radius:50px;padding:14px 36px;">
                        <a href="${resetUrl}"
                           style="color:#ffffff;font-size:15px;font-weight:700;
                                  text-decoration:none;letter-spacing:0.2px;">
                          Reset my password &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-align:center;">
                    Or copy this link into your browser:
                  </p>
                  <p style="margin:0 0 24px;font-size:11px;text-align:center;
                             word-break:break-all;color:#6b7280;">
                    ${resetUrl}
                  </p>

                  <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                    If you didn't request a password reset, please ignore this email.
                    Your account is safe — no changes have been made.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;
                            text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    &copy; ${new Date().getFullYear()} TekSchool, Bengaluru.
                    All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"TekSchool" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your TekSchool password (expires in 10 min)',
    html,
  });
};

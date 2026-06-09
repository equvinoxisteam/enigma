const { getLogoUrl } = require('../../utils/brand');

function verificationEmailTemplate(email, verificationUrl, name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Enigma Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #ffffff;">
                  <img src="${getLogoUrl()}" alt="Enigma Logo" style="max-width: 120px; height: auto; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #4881F8;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Verify Your Enigma Account</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hello ${name},</p>
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666;">
                    Thank you for registering with <strong>Enigma</strong> - the next-generation manufacturing procurement platform. To complete your registration, please verify your email address by clicking the button below:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}"
                      style="background-color: #4881F8; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </div>
                  
                  <p style="margin: 20px 0; font-size: 14px; color: #666;">
                    If the button doesn't work, you can also copy and paste the following link into your browser:
                  </p>
                  <p style="word-break: break-all; color: #4881F8; font-size: 12px; padding: 10px; background-color: #f0f0f0; border-radius: 4px;">${verificationUrl}</p>
                  
                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    This verification link will expire in <strong>24 hours</strong>. If you didn't create an account with Enigma, please ignore this email or contact our support team.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                    © ${new Date().getFullYear()} Enigma. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                    Need help? Contact us at support@enigma.com
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
}

function passwordResetTemplate(email, resetUrl, name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Enigma Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #ffffff;">
                  <img src="${getLogoUrl()}" alt="Enigma Logo" style="max-width: 120px; height: auto; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #4881F8;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hello ${name},</p>
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666;">
                    We received a request to reset your password for your <strong>Enigma</strong> account. If you made this request, please click the button below to reset your password:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="background-color: #4881F8; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                      Reset Password
                    </a>
                  </div>
                  
                  <p style="margin: 20px 0; font-size: 14px; color: #666;">
                    If the button doesn't work, you can also copy and paste the following link into your browser:
                  </p>
                  <p style="word-break: break-all; color: #4881F8; font-size: 12px; padding: 10px; background-color: #f0f0f0; border-radius: 4px;">${resetUrl}</p>
                  
                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    This password reset link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
                  </p>
                  
                  <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                      <strong>Security Notice:</strong> If you didn't request this password reset, your account may be at risk. Please contact support immediately.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                    © ${new Date().getFullYear()} Enigma. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                    Need help? Contact us at support@enigma.com
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
}

function welcomeEmailTemplate(email, name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Enigma</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #ffffff;">
                  <img src="${getLogoUrl()}" alt="Enigma Logo" style="max-width: 120px; height: auto; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #4881F8;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Enigma!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hello ${name},</p>
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666;">
                    Congratulations! Your email has been successfully verified and your account is now active.
                  </p>
                  <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666;">
                    You can now enjoy all the features of <strong>Enigma</strong> - the next-generation manufacturing procurement platform that combines the strengths of global platforms with unique Indian manufacturing advantages.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
                       style="background-color: #4881F8; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                      Login to Your Account
                    </a>
                  </div>
                  
                  <div style="margin-top: 30px; padding: 20px; background-color: #f0f8ff; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                      <li>Complete your profile to get the best matches</li>
                      <li>Explore the RFQ pool (for manufacturers) or create your first RFQ (for buyers)</li>
                      <li>Connect with top manufacturers and buyers in the network</li>
                    </ul>
                  </div>
                  
                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    If you have any questions, feel free to contact our support team.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                    © ${new Date().getFullYear()} Enigma. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                    Need help? Contact us at support@enigma.com
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
}

module.exports = {
  verificationEmailTemplate,
  passwordResetTemplate,
  welcomeEmailTemplate
};

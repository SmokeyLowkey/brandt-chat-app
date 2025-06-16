import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for new user invitations
const getInvitationEmailHtml = (
  userName: string,
  tenantName: string,
  tempPassword: string,
  loginUrl: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${tenantName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          padding: 20px;
          border: 1px solid #e1e1e1;
          border-radius: 5px;
        }
        .header {
          background-color: #E31937;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 5px 5px 0 0;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .button {
          display: inline-block;
          background-color: #E31937;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .credentials {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${tenantName}</h1>
        </div>
        
        <p>Hello ${userName},</p>
        
        <p>Your account has been created on the ${tenantName} platform. You can now log in using the following credentials:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> Your email address</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        
        <p><strong>Important:</strong> You will be required to change your password when you log in for the first time.</p>
        
        <p>
          <a href="${loginUrl}" class="button">Log In Now</a>
        </p>
        
        <p>If you have any questions or need assistance, please contact your administrator.</p>
        
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${tenantName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send an invitation email to a new user
 * @param to Recipient email address
 * @param userName User's name
 * @param tenantName Tenant/organization name
 * @param tempPassword Temporary password
 * @returns Promise with the send result
 */
export const sendInvitationEmail = async (
  to: string,
  userName: string,
  tenantName: string,
  tempPassword: string
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/login`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Brandt Chat App <noreply@brandt-chat-app.com>',
      to: [to],
      subject: `Welcome to ${tenantName}`,
      html: getInvitationEmailHtml(userName, tenantName, tempPassword, loginUrl),
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending invitation email:', error);
    return { success: false, error };
  }
};

/**
 * Generate a random temporary password
 * @param length Length of the password (default: 10)
 * @returns Random password string
 */
export const generateTemporaryPassword = (length = 10) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one character from each category
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // Lowercase
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // Number
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // Special
  
  // Fill the rest of the password
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};